/* eslint-disable @next/next/no-img-element */

/**
 * BrandLogo — the IAS wordmark as an SVG, in one component with a variant prop.
 *
 * Deliberately NOT the ias2 pattern of two separate components
 * (LogoDarkMode / LogoLightMode). One component, one source of truth; the
 * surface it sits on picks the variant:
 *
 *   variant="onLight"  → dark-ink logo for white/light backgrounds (header)
 *   variant="onDark"   → white/emerald logo for dark backgrounds (footer)
 *
 * The file names describe the ARTWORK's colour, so the mapping is intentionally
 * crossed: the "light mode" artwork is dark ink (for light surfaces) and the
 * "dark mode" artwork is white (for dark surfaces). Choosing by surface here
 * keeps call sites from having to remember that.
 *
 * When decorative (a wrapping <Link> already carries an aria-label), pass
 * decorative so alt="" and the img is hidden from the a11y tree to avoid a
 * double announce. Otherwise a real alt is rendered.
 */
export function BrandLogo({
  variant = "onLight",
  className = "",
  decorative = false,
  alt = "I Automate Shit",
}: {
  variant?: "onLight" | "onDark";
  className?: string;
  decorative?: boolean;
  alt?: string;
}) {
  const src =
    variant === "onDark"
      ? "/svgs/dark.mode__stacked.svg"
      : "/svgs/light.mode__stacked.svg";

  return (
    <img
      src={src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      className={className}
    />
  );
}
