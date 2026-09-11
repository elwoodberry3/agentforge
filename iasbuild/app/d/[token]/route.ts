import { NextResponse } from "next/server";
import { resolveToken } from "@/lib/signedLink";

/**
 * /d/[token] — serves a file behind a signed, expiring link (IAS delivery
 * pattern). Verifies the HMAC token, pulls the payload from Upstash, streams it
 * with the right Content-Type + Content-Disposition. Expired or missing => a
 * plain, honest message (no stack traces, no fabricated success).
 *
 * Why this route instead of an attachment: an .html attachment from a young
 * domain is a top-tier Gmail spam signal. A link on our OWN verified domain is
 * a trust signal instead. Same pattern across every Forge tool.
 */

export const runtime = "nodejs";

function textResponse(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await resolveToken(token);

  if (!result.ok) {
    if (result.error === "expired" || result.error === "gone") {
      return textResponse(
        "This download link has expired. Re-run the tool to generate a fresh copy.",
        410
      );
    }
    if (result.error === "not-configured") {
      return textResponse("Downloads are not configured on this environment.", 503);
    }
    return textResponse("Invalid download link.", 400);
  }

  return new NextResponse(result.content, {
    status: 200,
    headers: {
      "Content-Type": result.mime,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
