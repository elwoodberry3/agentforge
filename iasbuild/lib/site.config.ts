/**
 * site.config.ts — the slice of shared-site data the header/footer need.
 *
 * Deliberately NOT a copy of iasInitiative's funnel.config.ts. That file carries
 * the whole bootcamp funnel (hero, VSL, waitlist, HubSpot drip modes) which has
 * nothing to do with a standalone tool. SiteHeader/SiteFooter only read four
 * things — brand, nav, social, legal — so this exposes exactly those, shaped
 * identically so the copied components work unchanged.
 *
 * Keep this in sync with iasInitiative's funnel.config where it overlaps (social
 * links, legal hrefs) so the two properties present one brand.
 */
export const site = {
  brand: {
    name: "I Automate Shit",
    short: "IAS",
  },

  // Header nav. The tool lives on its own domain, so link OUT to the bootcamp
  // site for Tools/About rather than to local routes that don't exist here.
  // Adjust hrefs to your canonical bootcamp origin.
  nav: [
    { label: "Tools", href: "https://iasinitiative.vercel.app/tools" },
    { label: "About", href: "https://iasinitiative.vercel.app/about" },
  ],

  // Footer social — same set/shape as the bootcamp footer (keys map to inline
  // SVG glyphs already defined inside SiteFooter).
  social: [
    { key: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/ias-bootcamp" },
    { key: "youtube", label: "YouTube", href: "https://www.youtube.com/@iautomatesht" },
    { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@iautomateshit" },
    { key: "instagram", label: "Instagram", href: "https://www.instagram.com/iautomatesht" },
    { key: "facebook", label: "Facebook", href: "https://www.facebook.com/profile.php?id=61593049247788" },
    { key: "x", label: "X", href: "https://x.com/iautomaterobots" },
    { key: "threads", label: "Threads", href: "https://www.threads.com/@iautomatesht" },
  ],

  // Footer legal — point at the bootcamp site's legal pages (the tool has none
  // of its own). Change if the tool gets its own legal routes.
  legal: {
    privacyHref: "https://iasinitiative.vercel.app/legal/privacy",
    termsHref: "https://iasinitiative.vercel.app/legal/terms",
    disclaimerHref: "https://iasinitiative.vercel.app/legal/disclaimer",
  },
} as const;

export type Site = typeof site;
