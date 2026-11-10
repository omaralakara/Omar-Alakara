import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Barlow_Condensed, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display=Barlow_Condensed({subsets:["latin"],weight:["600","700"],variable:"--font-display",display:"swap"});
const sans=Space_Grotesk({subsets:["latin"],variable:"--font-sans",display:"swap"});

export const metadata: Metadata = {
  title: "Omar Al Akara — Creative development. Real-world impact.",
  description: "From Lebanon, Omar Al Akara builds digital experiences that connect people, solve problems, and help businesses grow: React and Next.js sites, Shopify and WordPress builds, technical SEO, and AI-assisted workflows.",
  icons: { icon: "/icon.svg" },
};

export default function Layout({ children }: { children: ReactNode }) {
  // Browser extensions (e.g. ColorZilla adds cz-shortcut-listen) edit <html>/<body> before React loads;
  // suppressHydrationWarning ignores attribute differences on these two elements only.
  return <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning><body suppressHydrationWarning>{children}</body></html>;
}
