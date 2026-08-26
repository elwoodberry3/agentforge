import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateClaudeMd, type ClaudeMdInput } from "@/lib/generateClaudeMd";
import { consume, checkOnly, clientIp } from "@/lib/server/rateLimit";
import { issueToken } from "@/lib/server/verifyToken";

/**
 * /api/send — generate + email the CLAUDE.md, now with the tool's soft-verify +
 * rate-limit + HubSpot-segmentation model.
 *
 * SOFT VERIFY (per decision): the FIRST generation for an email sends the file
 * free and unverified — let the developer feel the value before any gate. From
 * the 2nd generation on, an unverified email is asked to confirm. Verified users
 * continue until the daily ceiling (3/email, 5/IP), then → subscription paywall.
 *
 * The counter is authoritative and independent of verification: every generation
 * increments it, so staying unverified can NEVER be used to dodge the limit.
 *
 * HubSpot (via n8n): every send forwards a tool_use event. n8n upserts by email:
 *   - existing livestream contact → update usage props ONLY, no drip, suppression
 *     flag respected (Rule 1).
 *   - new tool-only person → created as tool_user_unconverted for a separate
 *     tool nurture (Rule 2). n8n owns that branching.
 */

const isEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || "").trim());

export async function POST(req: NextRequest) {
  let body: Partial<ClaudeMdInput> & { verified?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.projectName?.trim() || !body.oneLiner?.trim()) {
    return NextResponse.json({ error: "Project name and one-liner are required." }, { status: 422 });
  }
  if (!isEmail(body.email || "")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 422 });
  }

  const email = body.email!.trim().toLowerCase();
  const ip = clientIp(req.headers);

  // ── Gate 1: daily ceiling. Authoritative, atomic. Consume BEFORE sending. ──
  const gate = await consume(email, ip);
  if (gate.enforced && !gate.allowed) {
    return NextResponse.json(
      { ok: false, limited: true, reason: gate.reason, redirect: "/paywall" },
      { status: 429 },
    );
  }

  // ── Gate 2: soft verify. The 1st generation (emailCount === 1) is free and
  // unverified. From the 2nd on, require verification to continue. We know it's
  // the first use because consume() just returned emailCount === 1. When the
  // limiter is unenforced (no Redis) we treat every send as "first" (fail-open).
  const isFirstUse = !gate.enforced || gate.emailCount <= 1;
  const alreadyVerified = body.verified === true; // set by /api/verify round-trip

  if (!isFirstUse && !alreadyVerified) {
    // Mint a verify token carrying the generation payload so /api/verify can
    // complete THIS send after the click — nothing is lost.
    let token: string;
    try {
      token = issueToken(email, {
        projectName: body.projectName!,
        oneLiner: body.oneLiner!,
        buildType: body.buildType || "other",
        notes: body.notes || "",
        primaryGoal: body.primaryGoal || "",
        constraints: body.constraints || "",
        stack: Array.isArray(body.stack) ? body.stack.join("|") : "",
      });
    } catch {
      return NextResponse.json({ error: "Verification is not configured." }, { status: 500 });
    }
    const origin = req.headers.get("origin") || process.env.PUBLIC_ORIGIN || "";
    const verifyUrl = `${origin}/api/verify?token=${encodeURIComponent(token)}`;

    // Ask n8n (or Resend directly) to send the verify email.
    const verifyHook = process.env.N8N_VERIFY_WEBHOOK_URL;
    if (verifyHook) {
      try {
        await fetch(verifyHook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: "tool_verify_request", email, verify_url: verifyUrl }),
        });
      } catch (e) {
        console.error("[send] verify webhook error:", e);
      }
    } else {
      console.warn("[send] N8N_VERIFY_WEBHOOK_URL unset — verify link (log only):", verifyUrl);
    }
    return NextResponse.json({ ok: false, needsVerify: true, next: "/verify-sent" }, { status: 200 });
  }

  // ── Generate + send the file (first use, or verified continuation) ─────────
  const input: ClaudeMdInput = {
    projectName: body.projectName!,
    oneLiner: body.oneLiner!,
    buildType: body.buildType || "other",
    notes: body.notes || "",
    primaryGoal: body.primaryGoal || "",
    stack: Array.isArray(body.stack) ? body.stack : [],
    constraints: body.constraints || "",
    email,
  };

  const fileContent = generateClaudeMd(input);
  const base64 = Buffer.from(fileContent, "utf-8").toString("base64");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: process.env.SEND_FROM || "IAS <build@elwoodberry.com>",
      to: email,
      subject: `Your CLAUDE.md for ${input.projectName}`,
      text: [
        `Here's your CLAUDE.md for "${input.projectName}".`,
        ``,
        `Next:`,
        `1. Open the project folder in VS Code.`,
        `2. Install the Claude Code for VS Code plugin.`,
        `3. Prompt Claude Code: "Read the CLAUDE.md file and then set up the project`,
        `   and the structure, and then we'll start building workflows together."`,
        ``,
        `— IAS`,
      ].join("\n"),
      attachments: [{ filename: "CLAUDE.md", content: base64 }],
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to send email." }, { status: 502 });
  }

  // ── HubSpot segmentation via n8n (Rule 1 + Rule 2). Fire-and-forget. ───────
  const leadHook = process.env.N8N_TOOL_WEBHOOK_URL;
  if (leadHook) {
    const record = {
      stage: "tool_use",
      tool: "agentforge-claude-md",
      email,
      email_verified: alreadyVerified || undefined,
      daily_email_count: gate.emailCount,
      last_used_at: new Date().toISOString(),
      // n8n decides drip suppression vs tool_user_unconverted based on whether
      // the contact already exists as a livestream lead. It does NOT enroll an
      // existing subscriber into any new drip.
      source: "agentforge-tool",
    };
    try {
      await fetch(leadHook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.N8N_WEBHOOK_SECRET ? { "x-ias-secret": process.env.N8N_WEBHOOK_SECRET } : {}),
        },
        body: JSON.stringify(record),
      });
    } catch (e) {
      console.error("[send] tool webhook error:", e);
    }
  } else {
    console.warn("[send] N8N_TOOL_WEBHOOK_URL unset — tool_use event not forwarded.");
  }

  return NextResponse.json({ ok: true, remaining: gate.emailRemaining });
}
