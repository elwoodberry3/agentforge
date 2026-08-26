import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { readToken } from "@/lib/server/verifyToken";
import { generateClaudeMd, type ClaudeMdInput, type BuildType } from "@/lib/generateClaudeMd";

/**
 * /api/verify — completes a generation that was held pending email confirmation.
 *
 * Unlike the livestream verify (which just enrolls), the tool's verify must
 * actually DELIVER the file the user was trying to generate. The token carries
 * the full generation payload, so we reconstruct the input and send — no state
 * store needed. The daily counter was already consumed on the /api/send call
 * that triggered this, so we do NOT double-count here.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const result = readToken(token);

  if (!result.ok) {
    return NextResponse.redirect(new URL(`/verify-sent?error=${result.error}`, req.url));
  }

  const { email, ctx } = result;

  const input: ClaudeMdInput = {
    projectName: ctx.projectName || "",
    oneLiner: ctx.oneLiner || "",
    buildType: (ctx.buildType as BuildType) || "other",
    notes: ctx.notes || "",
    primaryGoal: ctx.primaryGoal || "",
    constraints: ctx.constraints || "",
    stack: ctx.stack ? ctx.stack.split("|").filter(Boolean) : [],
    email,
  };

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && input.projectName) {
    const fileContent = generateClaudeMd(input);
    const base64 = Buffer.from(fileContent, "utf-8").toString("base64");
    const resend = new Resend(apiKey);
    try {
      await resend.emails.send({
        from: process.env.SEND_FROM || "IAS <build@elwoodberry.com>",
        to: email,
        subject: `Your CLAUDE.md for ${input.projectName}`,
        text: `Confirmed — here's your CLAUDE.md for "${input.projectName}". Open the folder in VS Code, install the Claude Code plugin, and prompt it to read the file.\n\n— IAS`,
        attachments: [{ filename: "CLAUDE.md", content: base64 }],
      });
    } catch (e) {
      console.error("[verify] send error:", e);
    }
  }

  // Mark verified so future sends this day skip the verify step. We pass it back
  // through the success page as a flag the client can persist in memory/session.
  const leadHook = process.env.N8N_TOOL_WEBHOOK_URL;
  if (leadHook) {
    try {
      await fetch(leadHook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "tool_verified",
          tool: "agentforge-claude-md",
          email,
          email_verified: true,
          verified_at: new Date().toISOString(),
          source: "agentforge-tool",
        }),
      });
    } catch (e) {
      console.error("[verify] webhook error:", e);
    }
  }

  return NextResponse.redirect(new URL(`/?verified=1`, req.url));
}
