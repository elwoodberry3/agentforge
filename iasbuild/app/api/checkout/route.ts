import { NextRequest, NextResponse } from "next/server";

/**
 * /api/checkout — Stripe Checkout Session for the monthly SUBSCRIPTION unlock.
 *
 * Differs from iasInitiative: mode=subscription (recurring), not payment
 * (one-time). Raw HTTP to Stripe's API — no SDK, version-stable.
 *
 * Requires: STRIPE_SECRET_KEY, STRIPE_PRICE_ID (a recurring price_…),
 *           PUBLIC_ORIGIN. Unconfigured → honest 501, paywall handles it.
 */
export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;
  const origin = process.env.PUBLIC_ORIGIN || req.headers.get("origin") || "";

  if (!key || !price) {
    return NextResponse.json(
      { ok: false, error: "Subscriptions aren't switched on yet.", configured: false },
      { status: 501 },
    );
  }

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { /* optional */ }
  const email = (body.email ?? "").trim();

  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("line_items[0][price]", price);
  form.set("line_items[0][quantity]", "1");
  form.set("success_url", `${origin}/?subscribed=1`);
  form.set("cancel_url", `${origin}/paywall?canceled=1`);
  if (email) form.set("customer_email", email);

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[checkout] stripe error:", data?.error?.message);
      return NextResponse.json({ ok: false, error: "Could not start checkout." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, url: data.url });
  } catch (err) {
    console.error("[checkout] error:", err);
    return NextResponse.json({ ok: false, error: "Could not start checkout." }, { status: 502 });
  }
}
