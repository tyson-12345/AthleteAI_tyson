import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AthleteAI — AI-Powered Sports Performance Coach",
  description: "Upload your training videos and get elite-level biomechanics analysis, personalized coaching feedback, injury prevention insights, and pro athlete comparisons — powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ background: "var(--bg)", minHeight: "100vh" }}>{children}</body>
    </html>
  );
}
