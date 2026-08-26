import { site } from "@/lib/site.config";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * SiteFooter — brand + legal + social.
 *
 * Social icons are driven from site.social (config-as-data). Each opens in a
 * new tab (target=_blank) with rel="noopener noreferrer". Icons are inline SVG
 * using currentColor so they inherit the emerald hover — no icon library, no
 * per-brand color drift. viewBox is normalized to 24×24.
 */

type IconProps = { className?: string };

const Icon = {
  linkedin: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.2.8 24 1.77 24h20.45c.98 0 1.78-.8 1.78-1.75V1.75C24 .78 23.2 0 22.22 0z" />
    </svg>
  ),
  youtube: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
    </svg>
  ),
  tiktok: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.01-2.82h-3.3v13.4a2.59 2.59 0 0 1-2.6 2.5 2.59 2.59 0 0 1-2.58-2.6 2.59 2.59 0 0 1 3.42-2.44V10.5a5.9 5.9 0 0 0-.84-.06A5.87 5.87 0 0 0 4 16.31 5.87 5.87 0 0 0 9.7 22a5.87 5.87 0 0 0 5.9-5.87V9.01a7.54 7.54 0 0 0 4.4 1.4V7.1a4.28 4.28 0 0 1-3.4-1.28z" />
    </svg>
  ),
  instagram: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91a5.88 5.88 0 0 0 1.38 2.13 5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" />
    </svg>
  ),
  facebook: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
    </svg>
  ),
  x: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3L17.61 20.65z" />
    </svg>
  ),
  threads: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
      <path d="M12.19 22.5h-.05c-3.06-.02-5.4-1.03-6.98-3-1.4-1.74-2.13-4.17-2.16-7.22v-.05c.03-3.06.76-5.48 2.16-7.23 1.58-1.96 3.93-2.97 6.98-3h.05c2.35.02 4.31.62 5.83 1.8a7.36 7.36 0 0 1 2.6 4.16l-2.14.6a5.18 5.18 0 0 0-1.83-2.98c-1.06-.82-2.5-1.24-4.3-1.26-2.35.02-4.13.75-5.28 2.18-1.08 1.34-1.63 3.28-1.65 5.76.02 2.48.57 4.42 1.65 5.76 1.15 1.43 2.93 2.16 5.28 2.18 2.12-.02 3.53-.52 4.7-1.68.66-.65 1.14-1.5 1.4-2.44l-3.6.02c-.12 1.13-1.09 2.01-2.4 2.01-1.5 0-2.6-1.14-2.6-2.53 0-1.6 1.4-2.63 3.4-2.63.7 0 1.32.08 1.85.24-.06-1.18-.62-1.83-1.82-1.83-.86 0-1.48.35-1.86 1.03l-1.95-1.05c.72-1.3 2.02-2 3.8-2 2.65 0 4.05 1.6 4.13 4.36l.01.15c.55.32 1.02.72 1.4 1.2l-.02-.03c.6.78.94 1.76.94 2.9 0 3.65-2.98 6.13-7.5 6.16z" />
    </svg>
  ),
};

type SocialKey = keyof typeof Icon;

export function SiteFooter() {
  return (
    <footer className="border-t border-hair bg-primary text-white">
      <div className="mx-auto flex max-w-page flex-col gap-8 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BrandLogo variant="onDark" className="h-10 w-auto" />
          <p className="mt-3 font-mono text-xs text-secondary-200">
            Practical AI &amp; automation. Just builds.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:items-end">
          {/* Social — icons link out, open in a new tab. */}
          <ul className="flex flex-wrap items-center gap-3">
            {site.social.map((s) => {
              const Glyph = Icon[s.key as SocialKey];
              return (
                <li key={s.key}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${site.brand.name} on ${s.label}`}
                    className="flex h-9 w-9 items-center justify-center border border-white/15 text-secondary-200 transition hover:border-accent hover:text-accent"
                  >
                    <Glyph className="h-[18px] w-[18px]" />
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Legal */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-secondary-200">
            <a href={site.legal.privacyHref} className="hover:text-accent">
              Privacy Policy
            </a>
            <a href={site.legal.termsHref} className="hover:text-accent">
              Terms &amp; Conditions
            </a>
            <a href={site.legal.disclaimerHref} className="hover:text-accent">
              Earnings Disclaimer
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
