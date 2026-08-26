import { createHmac, timingSafeEqual } from "crypto";

/**
 * verifyToken.ts — stateless double opt-in tokens.
 *
 * A verify link must prove (a) this email asked to subscribe and (b) the link
 * hasn't expired — without a token database. We do that with an HMAC-signed,
 * time-stamped payload. The server can verify any token it issued using the
 * secret; nothing is stored.
 *
 * Token = base64url(payload) + "." + base64url(hmac(payload))
 * payload = { e: email, ctx: {...}, iat, exp }
 *
 * Governance: the secret (VERIFY_SECRET) is required. If it's missing we refuse
 * to mint tokens rather than issue forgeable ones — fail closed on security.
 */

const SECRET = process.env.VERIFY_SECRET || "";
const TTL_MS = 1000 * 60 * 60 * 24; // 24h to confirm

type Payload = {
  e: string; // email
  ctx?: Record<string, string>; // carried form context (firstName, role, goal…)
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

export function issueToken(email: string, ctx?: Record<string, string>): string {
  if (!SECRET) throw new Error("VERIFY_SECRET not set — refusing to mint token");
  const now = Date.now();
  const payload: Payload = { e: email.trim().toLowerCase(), ctx, iat: now, exp: now + TTL_MS };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export type VerifyResult =
  | { ok: true; email: string; ctx: Record<string, string> }
  | { ok: false; error: "malformed" | "bad-signature" | "expired" | "no-secret" };

export function readToken(token: string): VerifyResult {
  if (!SECRET) return { ok: false, error: "no-secret" };
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
  return { ok: true, email: payload.e, ctx: payload.ctx ?? {} };
}

export const verifyConfigured = Boolean(SECRET);
