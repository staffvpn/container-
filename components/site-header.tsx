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
    <header className="hidden items-center justify-between px-8 py-5 md:flex">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Контейнер
      </Link>

      <nav className="flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] p-1 text-sm text-[var(--color-ink-soft)]">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 transition-colors ${
                active ? "bg-[var(--color-accent)] text-[var(--color-ink)]" : "hover:text-[var(--color-ink)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/profile"
        className="rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm text-white hover:opacity-90"
      >
        Профиль
      </Link>
    </header>
  );
}
