"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Главная" },
  { href: "/suppliers", label: "Поставщики" },
  { href: "/map", label: "Карта" },
  { href: "/offers", label: "Предложения" },
  { href: "/profile", label: "Профиль" },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex justify-between border-t border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-2 md:hidden">
      {tabs.map((tab) => {
        const active =
          tab.href === "/" ? pathname === "/" : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center gap-1 py-1 text-center text-xs"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[var(--color-accent)]" : "bg-transparent"}`}
            />
            <span className={active ? "font-medium text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
