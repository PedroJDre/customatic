import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { getLocale } from "@/i18n/server";
import "./globals.css";

const font = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Customatic", template: "%s · Customatic" },
  description:
    "Open-source feedback widget. One script tag puts a feedback button on your site; problems, ideas and comments land in a shared inbox.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={font.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
