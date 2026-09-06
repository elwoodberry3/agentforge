"use client";

import { useState } from "react";
import type { BuildType, ClaudeMdInput } from "@/lib/generateClaudeMd";

const STACK_OPTIONS = [
  "Next.js 14 (App Router)",
  "TypeScript",
  "Tailwind CSS",
  "Vercel",
  "n8n (cloud)",
  "Neon Postgres + Drizzle",
  "Auth.js v5",
  "Resend",
  "Node.js",
  "Python",
];

const BUILD_TYPES: { value: BuildType; label: string }[] = [
  { value: "web-app", label: "Web app" },
  { value: "automation", label: "Automation (n8n)" },
  { value: "api-service", label: "API / service" },
  { value: "cli-tool", label: "CLI tool" },
  { value: "content-site", label: "Content site" },
  { value: "other", label: "Other" },
];

const empty: ClaudeMdInput = {
  projectName: "",
  oneLiner: "",
  buildType: "web-app",
  notes: "",
  primaryGoal: "",
  stack: [],
  constraints: "",
  email: "",
};

const isEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim());

export default function ClaudeMdForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ClaudeMdInput>(empty);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ClaudeMdInput>(k: K, v: ClaudeMdInput[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const toggleStack = (s: string) =>
    setData((d) => ({
      ...d,
      stack: d.stack.includes(s) ? d.stack.filter((x) => x !== s) : [...d.stack, s],
    }));

  // Step gates — only projectName, one-liner, and a valid email are required.
  const canNext =
    (step === 1 && data.projectName.trim() && data.oneLiner.trim()) ||
    (step === 2 && true) ||
    (step === 3 && true);

  async function submit() {
    setError(null);
    if (!isEmail(data.email)) {
      setError("Enter a valid email so we can send the file.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));

      // Daily ceiling tripped → subscription paywall.
      if (res.status === 429 && payload.limited) {
        window.location.href = payload.redirect || "/paywall";
        return;
      }
      // Soft verify: not the first use and not yet verified → confirm email.
      if (payload.needsVerify) {
        setNeedsVerify(true);
        return;
      }
      if (!res.ok || payload.ok === false) {
        throw new Error(payload.error || "Send failed");
      }
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (needsVerify) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-8 text-center">
        <h3 className="text-xl font-semibold text-[#0A2E36]">One quick confirm.</h3>
        <p className="mt-2 text-[#374151]">
          You&apos;ve used your first free generation — nice. To keep going, confirm
          your email: I just sent a link to <strong>{data.email}</strong>. Click it
          and this file lands in your inbox.
        </p>
        <p className="mt-4 font-mono text-xs text-[#6B7280]">
          Didn&apos;t get it? Check spam or the promotions tab.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-8 text-center">
        <h3 className="text-xl font-semibold text-[#0A2E36]">Check your inbox.</h3>
        <p className="mt-2 text-[#374151]">
          Your <code>CLAUDE.md</code> is on its way to {data.email}.
        </p>
        <div className="mt-6 rounded-md bg-[#F9FAFB] p-4 text-left text-sm text-[#111827]">
          <p className="font-medium">Next:</p>
          <ol className="ml-4 list-decimal space-y-1">
            <li>Open the project folder in VS Code.</li>
            <li>Install the Claude Code for VS Code plugin.</li>
            <li>
              Prompt Claude Code:{" "}
              <em>
                "Read the CLAUDE.md file and then set up the project and the
                structure, and then we'll start building workflows together."
              </em>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
      {/* Progress */}
      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: n <= step ? "#00E5A3" : "#E5E7EB" }}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0A2E36]">The basics</h3>
          <Field label="Project name">
            <input
              className="ias-input"
              value={data.projectName}
              onChange={(e) => set("projectName", e.target.value)}
              placeholder="e.g. invoice-triage-agent"
            />
          </Field>
          <Field label="One line: what is it?">
            <input
              className="ias-input"
              value={data.oneLiner}
              onChange={(e) => set("oneLiner", e.target.value)}
              placeholder="An agent that reads incoming invoices, flags anomalies, and routes them for approval."
            />
          </Field>
          <Field label="Build type">
            <div className="flex flex-wrap gap-2">
              {BUILD_TYPES.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => set("buildType", b.value)}
                  className="rounded-full border px-3 py-1 text-sm"
                  style={{
                    borderColor: data.buildType === b.value ? "#00E5A3" : "#E5E7EB",
                    background: data.buildType === b.value ? "rgba(0,229,163,0.04)" : "#fff",
                    color: "#111827",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0A2E36]">Your notes</h3>
          <p className="text-sm text-[#6B7280]">
            Paste loose notes, drafted copy, half-thoughts. We keep them verbatim —
            we don't rewrite your intent.
          </p>
          <Field label="Notes">
            <textarea
              className="ias-input min-h-[160px]"
              value={data.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder={`Paste anything — half-formed is fine. Tools it calls, APIs it hits, the framework you're on, models, where it runs, what's tripped you up so far. e.g. "orchestrated agent, calls our billing API + a fraud-check tool, human-in-the-loop on anything over $5k, keeps hallucinating vendor names..."`}
            />
          </Field>
          <Field label="What does 'done' look like?">
            <input
              className="ias-input"
              value={data.primaryGoal}
              onChange={(e) => set("primaryGoal", e.target.value)}
              placeholder="A working agent that triages a real invoice end-to-end and escalates the edge cases correctly."
            />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0A2E36]">Stack & constraints</h3>
          <Field label="Tech stack (pick any)">
            <div className="flex flex-wrap gap-2">
              {STACK_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStack(s)}
                  className="rounded-full border px-3 py-1 text-sm"
                  style={{
                    borderColor: data.stack.includes(s) ? "#00E5A3" : "#E5E7EB",
                    background: data.stack.includes(s) ? "rgba(0,229,163,0.04)" : "#fff",
                    color: "#111827",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Constraints / non-goals (optional)">
            <textarea
              className="ias-input min-h-[90px]"
              value={data.constraints}
              onChange={(e) => set("constraints", e.target.value)}
              placeholder="No fine-tuning. Read-only on the billing API. Not building the approval UI in v1."
            />
          </Field>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0A2E36]">Where do we send it?</h3>
          <Field label="Email">
            <input
              className="ias-input"
              type="email"
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* Nav */}
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep((s) => s - 1)}
          className="rounded-md px-4 py-2 text-sm text-[#6B7280] disabled:opacity-40"
        >
          Back
        </button>
        {step < 4 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="rounded-md px-5 py-2 text-sm font-semibold disabled:opacity-40"
            style={{ background: "#00E5A3", color: "#0A2E36" }}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={sending}
            onClick={submit}
            className="rounded-md px-5 py-2 text-sm font-semibold disabled:opacity-60"
            style={{ background: "#00E5A3", color: "#0A2E36" }}
          >
            {sending ? "Sending…" : "Send my CLAUDE.md"}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#111827]">{label}</span>
      {children}
    </label>
  );
}
