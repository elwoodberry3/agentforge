/**
 * limits.config.ts — daily-limit + subscription-paywall policy for the tool.
 *
 * Same two-counter model as iasInitiative (3/email, 5/IP) but the paywall is a
 * monthly SUBSCRIPTION, not a one-time unlock — a developer who uses this weekly
 * wants a subscription, not repeated unlocks.
 *
 * Governance (Article VI / IX): ceilings shown honestly. This is a rate limiter,
 * not identity detection. The limit is a price signal for serious, recurring use.
 */
export const limits = {
  perEmailPerDay: 3,
  perIpPerDay: 5,
  windowSeconds: 60 * 60 * 24,

  paywall: {
    eyebrow: "Daily limit reached",
    heading: "You've used your free generations for today.",
    sub: "The free tier covers a few CLAUDE.md files a day — enough to make it part of your workflow. If you're building with it daily, a subscription lifts the cap and keeps you moving.",
    ctaPrimary: "Subscribe for unlimited",
    ctaNote: "Monthly. Cancel anytime. You keep everything you've generated.",
    reset: "Your free generations reset tomorrow.",
  },

  reasons: {
    email: "email" as const,
    ip: "ip" as const,
  },
} as const;

export type LimitReason = (typeof limits.reasons)[keyof typeof limits.reasons];
