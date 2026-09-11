import { createHmac, timingSafeEqual, randomBytes } from "crypto";

/**
 * signedLink.ts — signed, expiring download links (Option 2, IAS pattern).
 *
 * Enterprise delivery pattern shared by every Forge tool: instead of ATTACHING
 * files (an .html attachment is a top-tier Gmail spam signal), the email links
 * to /d/<token> on the tool's OWN verified domain. The token is an HMAC-signed,
 * time-stamped pointer to a payload cached in Upstash under an opaque key. The
 * link IS the credential; it dies at the TTL. No login, no session, no DB row
 * to clean up — the cache entry self-expires with the same TTL.
 *
 *   token   = base64url(payload) + "." + base64url(hmac(payload))
 *   payload = { k: storageKey, f: filename, m: mime, iat, exp }
 *
 * Governance (Article IX): DOWNLOAD_SECRET is required. Missing secret => refuse
 * to mint (fail closed on security). Missing Upstash => stash() reports it and
 * the caller falls back to attaching, rather than minting a link to nothing.
 *
 * Reuses the exact conventions from lib/server/verifyToken.ts + rateLimit.ts:
 * base64url, timingSafeEqual, raw-HTTP Upstash (no SDK).
 */

const SECRET = process.env.DOWNLOAD_SECRET || "";
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24h

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const signedLinkConfigured = Boolean(SECRET && REST_URL && REST_TOKEN);

type Payload = {
  k: string; // opaque storage key in Upstash
  f: string; // download filename, e.g. "CLAUDE.md"
  m: string; // mime type
  iat: number;
  exp: number;
};

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}
function sign(payloadB64: string): string {
  return b64url(createHmac("sha256", SECRET).update(payloadB64).digest());
}

// ── Upstash (raw HTTP, matches rateLimit.ts) ──────────────────────────────
// Sends ONE command per call to the base REST endpoint as a single JSON array
// (["SET", key, val, "EX", "86400"]) — the base endpoint's documented shape.
// Every element is stringified: Upstash 400s on a bare number in the array.
// On error we surface the actual response body, not just the status, so a 400
// tells you WHY (bad command, oversized value, wrong endpoint) instead of a
// bare number.
async function redis(command: (string | number)[]): Promise<any> {
  const stringCommand = command.map((c) => String(c));
  const res = await fetch(REST_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(stringCommand),
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`Upstash ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  // Single-command response shape: { result: ... }
  return data?.result;
}

/**
 * Stash a file payload in Upstash under a random opaque key with a TTL, and
 * return a signed token pointing at it. Returns null if not configured so the
 * caller can fall back to attaching.
 */
export async function stashAndSign(input: {
  content: string;
  filename: string;
  mime: string;
  ttlMs?: number;
}): Promise<string | null> {
  if (!signedLinkConfigured) return null;
  const ttl = input.ttlMs ?? DEFAULT_TTL_MS;
  const key = "dl:" + b64url(randomBytes(18));
  const ttlSeconds = Math.ceil(ttl / 1000);

  // SET key <content> EX <ttlSeconds> — payload self-expires; no cleanup job.
  // TTL must be a STRING: Upstash's REST pipeline rejects a bare number in the
  // command array with a 400 (unquoted "EX",86400 is invalid; "EX","86400" is ok).
  await redis(["SET", key, input.content, "EX", String(ttlSeconds)]);

  const now = Date.now();
  const payload: Payload = { k: key, f: input.filename, m: input.mime, iat: now, exp: now + ttl };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export type ResolveResult =
  | { ok: true; content: string; filename: string; mime: string }
  | { ok: false; error: "malformed" | "bad-signature" | "expired" | "not-configured" | "gone" };

/** Verify a token and fetch its payload. Used by the /d/[token] route. */
export async function resolveToken(token: string): Promise<ResolveResult> {
  if (!signedLinkConfigured) return { ok: false, error: "not-configured" };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, error: "malformed" };
  const [payloadB64, sig] = parts;

  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, error: "bad-signature" };

  let payload: Payload;
  try {
    payload = JSON.parse(unb64url(payloadB64).toString("utf8"));
  } catch {
    return { ok: false, error: "malformed" };
  }
  if (Date.now() > payload.exp) return { ok: false, error: "expired" };

  const content = await redis(["GET", payload.k]);
  // Cache entry expired (or evicted) even though the signature is still in-window.
  if (content == null) return { ok: false, error: "gone" };

  return { ok: true, content: String(content), filename: payload.f, mime: payload.m };
}

/** Convenience for building the absolute link an email should carry. */
export function downloadUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/d/${token}`;
}
