import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { onest } from "@/lib/fonts";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileTabBar } from "@/components/mobile-tab-bar";

const siteUrl = "https://gryadka.example";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Грядка — поставщики для HoReCa",
    template: "%s — Грядка",
  },
  description: "Платформа, где заведения HoReCa находят поставщиков и сравнивают условия — без десятка открытых вкладок.",
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "Грядка",
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    title: "Грядка — поставщики для HoReCa",
    description: "Платформа, где заведения HoReCa находят поставщиков и сравнивают условия — без десятка открытых вкладок.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={onest.variable}>
      <body className="font-sans pb-14 md:pb-0">
        <SiteHeader />
        {children}
        <SiteFooter />
        <MobileTabBar />
      </body>
    </html>
  );
}
