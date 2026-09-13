"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Главная" },
  { href: "/suppliers", label: "Поставщики" },
  { href: "/map", label: "Карта" },
  { href: "/offers", label: "Предложения" },
  { href: "/suppliers-portal", label: "Для поставщиков" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="hidden md:flex items-center justify-between border-b border-[var(--color-line)] px-8 py-4">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Контейнер
      </Link>
      <nav className="flex items-center gap-1 text-sm text-[var(--color-ink-soft)]">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 transition-colors ${
                active
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-ink)]"
                  : "hover:text-[var(--color-ink)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/profile"
        className="rounded-full border border-[var(--color-line)] px-5 py-2 text-sm hover:border-[var(--color-ink)]"
      >
        Профиль
      </Link>
    </header>
  );
}
