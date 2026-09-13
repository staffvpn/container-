"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cheri } from "@/lib/fonts";

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
      <Link href="/" className="flex items-center gap-2">
        <Image src="/images/logo2.png" alt="" width={32} height={32} className="h-8 w-8" />
        <span
          className={`${cheri.variable} font-[family-name:var(--font-cheri)] text-[34px] leading-none tracking-tight`}
        >
          Грядка
        </span>
      </Link>

      <nav className="flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] p-1.5 text-base text-[var(--color-ink-soft)]">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-5 py-3 transition-colors ${
                active ? "bg-[var(--color-accent)] text-white" : "hover:text-[var(--color-ink)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="/suppliers"
          aria-label="Поиск"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-line)] hover:border-[var(--color-ink)]"
        >
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
            <path d="M16 16L13 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </Link>
        <Link
          href="/profile"
          className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-base text-white hover:opacity-90"
        >
          Профиль
        </Link>
      </div>
    </header>
  );
}
