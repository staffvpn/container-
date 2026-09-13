import Image from "next/image";
import Link from "next/link";
import { getSuppliers, getCategories } from "@/lib/data/suppliers";
import { offers } from "@/lib/data/fixtures/offers";
import { cities } from "@/lib/data/fixtures/cities";
import { SearchBar } from "@/components/search-bar";
import { CategoryCard } from "@/components/category-card";
import { SupplierCard } from "@/components/supplier-card";
import { OfferTeaserCard } from "@/components/offer-teaser-card";
import { BecomeSupplierSection } from "@/components/become-supplier-section";
import { WhyGryadkaSection } from "@/components/why-gryadka-section";
import { ArrowIconButton } from "@/components/arrow-icon-button";

const segments = [
  {
    name: "Кофейни",
    category: "coffee-tea",
    tags: ["Кофе", "Выпечка", "Сиропы"],
  },
  {
    name: "Рестораны и бары",
    category: "alcohol",
    tags: ["Продукты", "Алкоголь", "Оборудование"],
  },
  {
    name: "Отели",
    category: "chemistry",
    tags: ["Химия", "Мебель", "IT-сервисы"],
  },
  {
    name: "Кейтеринг",
    category: "packaging",
    tags: ["Упаковка", "Логистика", "Посуда"],
  },
];

export default async function HomePage() {
  const [categories, popularSuppliers] = await Promise.all([
    getCategories(),
    getSuppliers({ sort: "rating" }),
  ]);
  const topSuppliers = popularSuppliers.slice(0, 6);

  return (
    <main className="flex flex-col">
      <section className="relative flex min-h-[640px] w-full items-end bg-[var(--color-panel)] px-6 pb-16 md:min-h-[760px] md:px-16 md:pb-20">
        <Image
          src="/images/hero-farm.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1800px]">
          <div className="flex max-w-2xl flex-col items-start gap-6">
            <h1 className="text-6xl font-semibold uppercase leading-[0.95] tracking-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.35)] md:text-7xl lg:text-8xl">
              Найдите
              <br />
              поставщика
            </h1>
            <p className="max-w-md text-lg text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">
              Поставщики для кофеен, ресторанов, баров и других заведений HoReCa — в одном месте.
            </p>
            <SearchBar />
          </div>
        </div>

        <Link
          href="/suppliers"
          className="absolute bottom-6 right-6 z-10 hidden items-center gap-4 rounded-[24px] bg-[var(--color-surface)] p-5 md:flex"
        >
          <div>
            <p className="text-3xl font-semibold tracking-tight">{popularSuppliers.length}+</p>
            <p className="text-sm text-[var(--color-ink-soft)]">поставщиков уже в Грядке</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-white">
            <ArrowIconButton />
          </span>
        </Link>
      </section>

      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-24 px-6 py-20 md:px-12 md:py-24 lg:px-20">
        <section className="flex flex-col gap-10 md:flex-row md:items-start">
          <div className="flex max-w-xs shrink-0 flex-col gap-4">
            <span className="w-fit rounded-full bg-[var(--color-panel)] px-4 py-1.5 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              Для кого
            </span>
            <h2 className="text-3xl font-semibold leading-tight">
              Для любого заведения HoReCa
            </h2>
            <p className="text-[var(--color-ink-soft)]">
              От небольшой кофейни до сети ресторанов — находите поставщиков под свой формат.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {segments.map((segment) => (
              <Link
                key={segment.name}
                href={`/suppliers?category=${segment.category}`}
                className="group flex flex-col gap-3 rounded-[28px] bg-[var(--color-panel)] p-4"
              >
                <div className="flex aspect-[4/5] flex-col justify-end gap-2 rounded-[20px] bg-[var(--color-ink)]/5 p-3">
                  {segment.tags.map((tag) => (
                    <span
                      key={tag}
                      className="w-fit rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="font-medium">{segment.name}</span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] group-hover:bg-[var(--color-accent)] group-hover:text-white">
                    <ArrowIconButton />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <span className="w-fit rounded-full bg-[var(--color-panel)] px-4 py-1.5 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Категории
          </span>
          <h2 className="text-3xl font-semibold">Найдите поставщика по категории</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </section>

        <WhyGryadkaSection />

        <section className="flex flex-col gap-6">
          <span className="mx-auto w-fit rounded-full bg-[var(--color-panel)] px-4 py-1.5 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Поставщики
          </span>
          <h2 className="text-center text-3xl font-semibold md:text-4xl">
            Проверенные поставщики для вашего бизнеса
          </h2>
          <p className="mx-auto max-w-xl text-center text-[var(--color-ink-soft)]">
            От небольших локальных производителей до крупных дистрибьюторов — с реальным
            рейтингом и условиями работы.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topSuppliers.map((supplier) => (
              <SupplierCard key={supplier.slug} supplier={supplier} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-3xl font-semibold md:text-4xl">Акции и спецпредложения</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {offers.map((offer) => {
              const supplier = popularSuppliers.find((s) => s.slug === offer.supplierSlug);
              return (
                <OfferTeaserCard key={offer.id} offer={offer} supplierName={supplier?.name ?? ""} />
              );
            })}
          </div>
        </section>

        <section className="relative flex aspect-[21/9] w-full items-end overflow-hidden rounded-[32px] bg-[var(--color-ink)]">
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4 p-8 text-center text-white md:p-12">
            <h2 className="text-3xl font-semibold">Наш Telegram-канал</h2>
            <p className="text-white/80">
              Новости поставщиков, новые предложения и обновления Грядки — в нашем
              Telegram-канале.
            </p>
            <a
              href="https://t.me/gryadka"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-[var(--color-ink)] hover:opacity-90"
            >
              Перейти в канал
            </a>
          </div>
        </section>

        <BecomeSupplierSection />
      </div>
    </main>
  );
}
