import { limits, type LimitReason } from "@/lib/limits.config";
import { createHash } from "crypto";

/**
 * rateLimit.ts — the two-counter daily limiter, backed by Upstash Redis.
 *
 * Design:
 *  - Two atomic counters per day: one keyed on the hashed email, one on the
 *    hashed IP. INCR is atomic; the first INCR of a key sets its TTL so the
 *    window self-resets — no cron.
 *  - We hash email + IP before they become keys (sha256, truncated). Redis
 *    never stores a raw email or raw IP; keys are opaque. This is deliberate
 *    for privacy (ties to /legal/privacy) — we meter without retaining PII.
 *  - checkOnly() reads without incrementing (for gating the UI). consume()
 *    increments and is the authoritative gate on the server.
 *
 * Governance (Article IX): if Redis isn't configured we FAIL OPEN and say so in
 * the return (`enforced: false`) rather than silently blocking or pretending a
 * limit is enforced. An honest "not enforced yet" beats a fake guarantee.
 */

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const configured = Boolean(REST_URL && REST_TOKEN);

/** Opaque, stable day bucket in UTC, e.g. "2026-08-25". */
function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function hash(input: string): string {
  return createHash("sha256").update(input.trim().toLowerCase()).digest("hex").slice(0, 24);
}

/** Minimal Upstash REST calls — no SDK dependency, version-stable (raw HTTP). */
async function redis(command: (string | number)[]): Promise<any> {
  const res = await fetch(REST_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([command]),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const data = await res.json();
  // Pipeline response: [{ result }]
  return Array.isArray(data) ? data[0]?.result : data?.result;
}

/** INCR a key and set TTL on first write. Returns the new count. */
async function incrWithTtl(key: string): Promise<number> {
  const n = (await redis(["INCR", key])) as number;
  if (n === 1) await redis(["EXPIRE", key, limits.windowSeconds]);
  return n;
}

async function getCount(key: string): Promise<number> {
  const v = await redis(["GET", key]);
  return v ? Number(v) : 0;
}

export type LimitResult = {
  allowed: boolean;
  enforced: boolean; // false when Redis unconfigured (fail-open, honest)
  reason?: LimitReason;
  emailCount: number;
  ipCount: number;
  emailRemaining: number;
  ipRemaining: number;
};

function keys(email: string, ip: string) {
  const day = dayKey();
  return {
    email: `ias:gen:email:${hash(email)}:${day}`,
    ip: `ias:gen:ip:${hash(ip)}:${day}`,
  };
}

/** Read-only check — does NOT increment. Use to gate UI / pre-flight. */
export async function checkOnly(email: string, ip: string): Promise<LimitResult> {
  if (!configured) {
    return {
      allowed: true,
      enforced: false,
      emailCount: 0,
      ipCount: 0,
      emailRemaining: limits.perEmailPerDay,
      ipRemaining: limits.perIpPerDay,
    };
  }
  const k = keys(email, ip);
  const [emailCount, ipCount] = await Promise.all([getCount(k.email), getCount(k.ip)]);
  const emailOver = emailCount >= limits.perEmailPerDay;
  const ipOver = ipCount >= limits.perIpPerDay;
  return {
    allowed: !emailOver && !ipOver,
    enforced: true,
    reason: emailOver ? limits.reasons.email : ipOver ? limits.reasons.ip : undefined,
    emailCount,
    ipCount,
    emailRemaining: Math.max(0, limits.perEmailPerDay - emailCount),
    ipRemaining: Math.max(0, limits.perIpPerDay - ipCount),
  };
}

/**
 * Authoritative gate. Increments BOTH counters and returns whether this request
 * is allowed. Call this only for a *verified* generate (see double opt-in) so
 * unverified submits never burn quota.
 *
 * Note: we increment both, then judge. Over-count on a blocked request is fine —
 * it only makes the limiter slightly stricter for a genuine abuser, never looser
 * for an honest user (an honest user won't be at the ceiling to begin with).
 */
export async function consume(email: string, ip: string): Promise<LimitResult> {
  if (!configured) {
    return {
      allowed: true,
      enforced: false,
      emailCount: 0,
      ipCount: 0,
      emailRemaining: limits.perEmailPerDay,
      ipRemaining: limits.perIpPerDay,
    };
  }
  const k = keys(email, ip);
  const [emailCount, ipCount] = await Promise.all([incrWithTtl(k.email), incrWithTtl(k.ip)]);
  const emailOver = emailCount > limits.perEmailPerDay;
  const ipOver = ipCount > limits.perIpPerDay;
  return {
    allowed: !emailOver && !ipOver,
    enforced: true,
    reason: emailOver ? limits.reasons.email : ipOver ? limits.reasons.ip : undefined,
    emailCount,
    ipCount,
    emailRemaining: Math.max(0, limits.perEmailPerDay - emailCount),
    ipRemaining: Math.max(0, limits.perIpPerDay - ipCount),
  };
}

/** Extract the client IP from Vercel/proxy headers, best-effort. */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || "0.0.0.0";
}

export const limiterConfigured = configured;
