import Link from "next/link";

const navItems = [
  { href: "/", label: "Главная" },
  { href: "/suppliers", label: "Поставщики" },
  { href: "/map", label: "Карта" },
  { href: "/offers", label: "Предложения" },
  { href: "/suppliers-portal", label: "Для поставщиков" },
];

export function SiteHeader() {
  return (
    <header className="hidden md:flex items-center justify-between border-b border-[var(--color-line)] px-8 py-4">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Контейнер
      </Link>
      <nav className="flex items-center gap-6 text-sm text-[var(--color-ink-soft)]">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="hover:text-[var(--color-ink)]">
            {item.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/profile"
        className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-4 py-2 text-sm"
      >
        Профиль
      </Link>
    </header>
  );
}
