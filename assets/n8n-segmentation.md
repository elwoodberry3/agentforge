# AgentForge → HubSpot Segmentation (n8n)

The tool sends events to `N8N_TOOL_WEBHOOK_URL`. This documents the branching
n8n must do to honor the two segmentation rules — the part that keeps your list
clean and your funnel honest.

## The events

**`tool_use`** — fires on every successful generation:
```json
{
  "stage": "tool_use",
  "tool": "agentforge-claude-md",
  "email": "dev@example.com",
  "daily_email_count": 1,
  "last_used_at": "2026-08-26T00:00:00.000Z",
  "source": "agentforge-tool"
}
```

**`tool_verified`** — fires when a user confirms their email (soft-verify click).

## The branching (this is the whole point)

Upsert the contact by email (`idProperty=email`) so an existing contact is
updated, never duplicated. Then branch on **does this contact already exist as a
livestream lead?**

### Rule 1 — Already a livestream subscriber
If the contact exists AND has the livestream lifecycle/marker (e.g.
`ias_source = ias-vsl` or a `livestream_subscriber = true` property):

- **Update usage properties only.** Write `agentforge_last_used`,
  `agentforge_daily_count`. Nothing else.
- **Do NOT enroll in any drip.** No workflow enrollment, no list add that has a
  drip attached. Using the tool must not start a second email sequence for
  someone already being emailed.
- Respect any suppression/opt-out flag already on the contact.

> Enterprise reasoning: double-sequencing the same person from two entry points
> is the fastest route to spam complaints and deliverability decay. One person,
> one active sequence.

### Rule 2 — Tool-only, never signed up for the livestream
If the contact is new OR has no livestream marker:

- Create/update with `lifecycle_stage = tool_user_unconverted`.
- Write `agentforge_first_used`, usage props, and `tool_user = true`.
- Enroll in a **tool-appropriate nurture** whose goal is converting them to the
  livestream — written for a developer who already likes the tool, NOT the
  general livestream drip. Different audience, different copy.
- When they later sign up for the livestream, the livestream intake flips their
  stage and Rule 1 takes over from then on (the tool nurture should exit on that
  event to avoid overlap).

## Properties (HubSpot Free = 10 custom-property ceiling)

| Property                  | Written by      | Purpose                          |
| ------------------------- | --------------- | -------------------------------- |
| `agentforge_first_used`   | Rule 2          | First tool touch                 |
| `agentforge_last_used`    | both            | Recency                          |
| `agentforge_daily_count`  | both            | Usage intensity (mirror of Redis)|
| `tool_user`               | Rule 2          | Segments the tool-only cohort    |
| `email_verified`          | `tool_verified` | Soft-verify completion           |

That's 5 properties. Budget against the 10-property ceiling — this and the
livestream build share the same HubSpot Free account.

## Enforcement vs. record (unchanged principle)

- **Redis** is authoritative for the daily limit (3/email, 5/IP). n8n/HubSpot
  never gate access — they mirror usage for segmentation only.
- The **first** generation is intentionally free and unverified (soft verify).
  The `tool_use` event still fires on it, so even the free first use is recorded
  and the contact is captured.

## TODO chips (honest, unresolved)

- `TODO_STRIPE_FULFILMENT` — subscription checkout starts, but the
  `checkout.session.completed` webhook that lifts the Redis cap for a paying
  subscriber is **not yet wired**. A subscriber currently still hits the daily
  cap until this loop exists. Named, not faked.
- `TODO_VERIFIED_PERSISTENCE` — after a soft-verify click, "verified" is not yet
  persisted server-side, so a verified user could be asked to re-verify on a
  later day. Acceptable for v1 (re-verify is low friction); wire a Redis
  `verified:{emailHash}` flag to remove it.
