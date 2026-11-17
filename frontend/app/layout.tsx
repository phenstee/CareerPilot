import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-sans"
});

const serif = Newsreader({
  subsets: ["latin"],
  weight: ["500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif"
});

export const metadata: Metadata = {
  title: "CareerPilot",
  description:
    "Track internship and co-op applications, keep deadlines in view, and prepare for each role."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
