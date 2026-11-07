import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omar Al Akara | Portfolio",
  description: "Web development, e-commerce, and integrations by Omar Al Akara.",
  icons: { icon: "/icon.svg" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
