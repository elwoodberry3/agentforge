import type { Config } from "tailwindcss";

/**
 * Extended so the shared SiteHeader/SiteFooter (ported from iasInitiative) render
 * with correct brand tokens. Only the tokens those two components reference are
 * added. Values copied from iasInitiative's tailwind.config so the two
 * properties match exactly.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A2E36",
          50: "#E8F0F1",
          800: "#062028",
        },
        secondary: {
          DEFAULT: "#3F7266",
          200: "#9BBEC0",
          700: "#2A5047",
        },
        accent: {
          DEFAULT: "#00E5A3",
          600: "#00B882",
        },
        ink: "#111827",
        ash: "#F9FAFB",
        body: "#374151",
        muted: "#6B7280",
        hair: "#E5E7EB",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        page: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
