import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { onest } from "@/lib/fonts";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileTabBar } from "@/components/mobile-tab-bar";

export const metadata: Metadata = {
  title: "Грядка",
  description: "Платформа поставщиков для HoReCa",
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
