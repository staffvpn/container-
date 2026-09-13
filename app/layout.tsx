import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { onest } from "@/lib/fonts";
import { SiteHeader } from "@/components/site-header";
import { MobileTabBar } from "@/components/mobile-tab-bar";

export const metadata: Metadata = {
  title: "Контейнер",
  description: "Платформа поставщиков для HoReCa",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={onest.variable}>
      <body className="font-sans pb-14 md:pb-0">
        <SiteHeader />
        {children}
        <MobileTabBar />
      </body>
    </html>
  );
}
