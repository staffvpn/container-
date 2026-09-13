import {
  Unbounded,
  Playfair_Display,
  Golos_Text,
  Oswald,
  Inter,
  JetBrains_Mono,
  Roboto_Slab,
  IBM_Plex_Mono,
} from "next/font/google";

// All four support Cyrillic — required since every headline here is Russian.
export const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-variant-a",
  display: "swap",
});

export const playfairDisplay = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-variant-b-display",
  display: "swap",
});

export const golosText = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-variant-b-body",
  display: "swap",
});

export const oswald = Oswald({
  subsets: ["latin", "cyrillic"],
  variable: "--font-variant-c",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-variant-d-body",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-variant-d-mono",
  display: "swap",
});

export const robotoSlab = Roboto_Slab({
  subsets: ["latin", "cyrillic"],
  variable: "--font-variant-e",
  display: "swap",
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-variant-f",
  display: "swap",
});
