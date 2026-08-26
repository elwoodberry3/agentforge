"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { limits } from "@/lib/limits.config";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * /paywall — reached when a tool user trips the daily ceiling. Monthly
 * subscription unlock. Matches the tool's inline-token page style.
 */
function PaywallInner() {
  const params = useSearchParams();
  const canceled = params.get("canceled");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const c = limits.paywall;

  async function subscribe() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.status === 501 || data.configured === false) {
        setErr("Subscriptions aren't switched on yet. Please check back shortly.");
        setBusy(false);
        return;
      }
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start checkout.");
      window.location.href = data.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start checkout.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <p className="font-mono text-xs uppercase tracking-wider text-[#3F7266]">{c.eyebrow}</p>
      <h1 className="mt-2 text-2xl font-bold text-[#0A2E36]">{c.heading}</h1>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-[#374151]">{c.sub}</p>

      {canceled && (
        <p className="mt-3 font-mono text-xs text-[#6B7280]">
          No charge — you canceled checkout. Subscribe whenever you&apos;re ready.
        </p>
      )}

      <button
        onClick={subscribe}
        disabled={busy}
        className="mt-7 inline-flex items-center gap-2 rounded-[5px] bg-[#00E5A3] px-6 py-3 text-sm font-semibold text-[#0A2E36] transition hover:bg-[#00B882] disabled:opacity-60"
      >
        {busy ? "Starting checkout…" : c.ctaPrimary} <span aria-hidden>→</span>
      </button>
      <p className="mt-3 font-mono text-xs text-[#6B7280]">{c.ctaNote}</p>

      {err && (
        <p className="mt-5 max-w-md rounded-[5px] bg-[#F9FAFB] px-3 py-2 font-mono text-xs text-[#C0392B]">
          {err}
        </p>
      )}

      <p className="mt-8 font-mono text-xs text-[#9CA3AF]">{c.reset}</p>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function PaywallPage() {
  return (
    <Suspense fallback={null}>
      <PaywallInner />
    </Suspense>
  );
}
