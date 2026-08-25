import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IAS Build 021 — CLAUDE.md Generator",
  description:
    "Turn loose plain-English notes into a production-grade CLAUDE.md, delivered to your inbox and ready to open in Claude Code.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
