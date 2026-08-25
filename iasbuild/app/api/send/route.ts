import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateClaudeMd, type ClaudeMdInput } from "@/lib/generateClaudeMd";

// TODO_RATE_LIMIT: no rate limiting yet — add before public launch.
// TODO_PERSISTENCE: submissions are not stored — no lead captured on send.

const isEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || "").trim());

export async function POST(req: NextRequest) {
  let body: Partial<ClaudeMdInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Boundary validation (Article VIII: validate at the boundary).
  if (!body.projectName?.trim() || !body.oneLiner?.trim()) {
    return NextResponse.json({ error: "Project name and one-liner are required." }, { status: 422 });
  }
  if (!isEmail(body.email || "")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 422 });
  }

  const input: ClaudeMdInput = {
    projectName: body.projectName!,
    oneLiner: body.oneLiner!,
    buildType: body.buildType || "other",
    notes: body.notes || "",
    primaryGoal: body.primaryGoal || "",
    stack: Array.isArray(body.stack) ? body.stack : [],
    constraints: body.constraints || "",
    email: body.email!,
  };

  const fileContent = generateClaudeMd(input);
  const base64 = Buffer.from(fileContent, "utf-8").toString("base64");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Fail loud, never silently pretend it sent (demonstrate, never claim).
    return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: process.env.SEND_FROM || "IAS <build@elwoodberry.com>",
      to: input.email,
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

  return NextResponse.json({ ok: true });
}
