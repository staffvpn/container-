"use client";

import Image from "next/image";
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
      <Link href="/" className="flex h-14 items-center transition-transform duration-200 hover:scale-105">
        <Image src="/images/logo1.png" alt="Грядка" width={220} height={67} className="h-10 w-auto" priority />
      </Link>

      <nav className="flex h-14 items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-1.5 text-base text-[var(--color-ink-soft)]">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center rounded-full px-5 transition-all duration-200 ${
                active ? "bg-[var(--color-accent)] text-white" : "hover:bg-[var(--color-panel)] hover:text-[var(--color-ink)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <a
          href="https://t.me/nagryadke"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center rounded-full bg-[var(--color-ink)] px-4 text-sm text-white transition-transform duration-200 hover:scale-105 hover:opacity-90"
        >
          Telegram
        </a>
        <Link
          href="/profile"
          className="flex h-10 items-center rounded-full bg-[var(--color-ink)] px-4 text-sm text-white transition-transform duration-200 hover:scale-105 hover:opacity-90"
        >
          Профиль
        </Link>
      </div>
    </header>
  );
}
