# AgentForge  

AgentForge turns project requirements into a production-ready CLAUDE.md built for serious agentic development. Define your stack, architecture, standards, workflows, and expectations through a guided interface—then generate structured project context Claude Code, Skills, MCP servers, and agents can consistently reference.

## IAS Build 021 — CLAUDE.md Generator

Turn loose plain-English notes into a production-grade `CLAUDE.md`, emailed to the
user and ready to open in Claude Code.

### How it works

1. Multi-step form collects: project name, one-liner, build type, verbatim notes,
   goal, stack, constraints, email.
2. `lib/generateClaudeMd.ts` maps that input to a `CLAUDE.md` **deterministically** —
   no LLM, no invented details. Missing fields render as explicit `TODO:` markers.
3. `app/api/send/route.ts` validates input and emails the file as an attachment via Resend.
4. The user opens the folder in VS Code, installs the Claude Code plugin, and prompts:
   > "Read the CLAUDE.md file and then set up the project and the structure, and then
   > we'll start building workflows together."

### Why deterministic (Article IX)

The generator never guesses what the user meant. It preserves their notes verbatim and
names every gap as a `TODO:`. The output is 100% inspectable and reproducible.

### Active TODO chips (this build's honest gaps)

- `TODO_RATE_LIMIT` — no rate limiting on the send route.
- `TODO_EMAIL_VERIFY` — email captured but not verified (no double opt-in).
- `TODO_PERSISTENCE` — submissions not stored; no lead captured on generate.

### Run

```bash
npm install
cp .env.example .env.local   # add your Resend key
npm run dev
```

### Files

- `lib/generateClaudeMd.ts` — deterministic generator (the core).
- `lib/build.config.ts` — config-as-data for the build page.
- `components/ClaudeMdForm.tsx` — 4-step form.
- `app/api/send/route.ts` — validate + generate + email via Resend.
