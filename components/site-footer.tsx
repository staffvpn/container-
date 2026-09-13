import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/data/fixtures/categories";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/suppliers", label: "Поставщики" },
  { href: "/map", label: "Карта" },
  { href: "/offers", label: "Предложения" },
  { href: "/suppliers-portal", label: "Для поставщиков" },
];

const companyLinks = [
  { href: "/profile", label: "Профиль" },
  { href: "/#become-supplier", label: "Стать поставщиком" },
  { href: "https://t.me/gryadka", label: "Telegram-канал", external: true },
];

export function SiteFooter() {
  const footerCategories = categories.slice(0, 6);

  return (
    <footer className="bg-[var(--color-ink)] px-6 py-16 text-white md:px-16">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex max-w-xs flex-col gap-4">
            <Image
              src="/images/logo1.png"
              alt="Грядка"
              width={220}
              height={67}
              className="h-10 w-auto shrink-0 self-start brightness-0 invert"
            />
            <p className="text-sm text-white/60">
              Платформа, где заведения HoReCa находят поставщиков и сравнивают условия — без
              десятка открытых вкладок.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterColumn title="Навигация">
              {navLinks.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Категории">
              {footerCategories.map((category) => (
                <FooterLink key={category.slug} href={`/suppliers?category=${category.slug}`}>
                  {category.name}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Компания">
              {companyLinks.map((link) => (
                <FooterLink key={link.href} href={link.href} external={link.external}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Грядка</p>
          <p>Все поставщики проходят проверку перед публикацией.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-white/40">{title}</p>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-white/70 hover:text-white"
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="text-sm text-white/70 hover:text-white">
      {children}
    </Link>
  );
}
