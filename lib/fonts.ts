import { Onest } from "next/font/google";
import localFont from "next/font/local";

export const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

// Wordmark-only display font — small glyph set, not meant for body text.
export const cheri = localFont({
  src: "../public/fonts/cheri.ttf",
  variable: "--font-cheri",
  display: "swap",
});
