/**
 * Build 021 — config-as-data. Re-skinning is a one-file change.
 */
export const build021 = {
  buildNumber: 21,
  name: "CLAUDE.md Generator",
  sector: "Developer Tooling & AI Enablement",
  tagline:
    "Turn loose plain-English notes into a production-grade CLAUDE.md, delivered to your inbox and ready to open in Claude Code.",
  status: "live" as const, // Kinetic Emerald permitted: the generator genuinely runs.
  whatItDoes:
    "A multi-step form collects your project's plain-English notes, goal, stack, and constraints. A deterministic generator maps them into a rigorously formatted CLAUDE.md — no LLM, no invented details — and Resend emails you the file. You open the folder in VS Code, install the Claude Code plugin, and prompt it to read the file and scaffold the project.",
  stack: ["Next.js 14 (App Router)", "TypeScript", "Tailwind CSS", "Vercel", "Resend"],

  // Active TODO chips — real enterprise gaps this free build leaves open.
  todos: [
    {
      key: "TODO_RATE_LIMIT",
      label: "No rate limiting on the send route — abuse vector open.",
    },
    {
      key: "TODO_EMAIL_VERIFY",
      label: "Email is captured but not verified (no double opt-in yet).",
    },
    {
      key: "TODO_PERSISTENCE",
      label: "Submissions are not persisted — no lead is stored on generate.",
    },
  ],

  links: {
    github: "https://github.com/elwoodberry3/ias-build-021",
    portfolio: "https://claude-md.elwoodberry.com",
    booking: "https://elwoodberry.com/contact",
  },
} as const;

export type Build021Config = typeof build021;
