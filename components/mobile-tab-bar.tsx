import Link from "next/link";

const tabs = [
  { href: "/", label: "Главная" },
  { href: "/suppliers", label: "Поставщики" },
  { href: "/map", label: "Карта" },
  { href: "/offers", label: "Предложения" },
  { href: "/profile", label: "Профиль" },
];

export function MobileTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex justify-between border-t border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-2 md:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="flex-1 text-center text-xs text-[var(--color-ink-soft)]"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
