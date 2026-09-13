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
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-10 px-6 pb-24 pt-8 md:px-12 md:pt-10 lg:px-20">
        <section className="flex flex-col items-center gap-6 text-center">
          <Link
            href="/suppliers"
            className="flex items-center gap-2 rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-medium uppercase tracking-wide text-[var(--color-accent)]"
          >
            Платформа для HoReCa
            <ArrowIconButton />
          </Link>

          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Найдите поставщика для своего бизнеса
          </h1>

          <div className="flex w-full max-w-xl flex-col items-center gap-3">
            <SearchBar />
            <Link
              href="/#become-supplier"
              className="text-sm font-medium text-[var(--color-ink-soft)] underline decoration-[var(--color-accent)] decoration-2 underline-offset-4"
            >
              Стать поставщиком
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-[0.8fr_1.2fr]">
          <div className="relative h-[460px] overflow-hidden rounded-[32px] bg-[var(--color-panel)]">
            <Image
              src="/images/hero-farm.png"
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 35vw, 100vw"
              className="object-cover"
              style={{ objectPosition: "20% 50%" }}
            />
            <div className="absolute bottom-4 left-4 rounded-[20px] bg-[var(--color-surface)] px-5 py-4">
              <p className="text-2xl font-semibold tracking-tight">{popularSuppliers.length}+</p>
              <p className="text-sm text-[var(--color-ink-soft)]">поставщиков в Грядке</p>
            </div>
          </div>

          <div className="relative h-[460px] overflow-hidden rounded-[32px] bg-[var(--color-panel)]">
            <Image
              src="/images/hero-farm.png"
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover"
              style={{ objectPosition: "70% 40%" }}
            />
            <p className="absolute left-6 top-6 max-w-xs text-sm text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]">
              Поставщики для кофеен, ресторанов, баров и других заведений HoReCa.
            </p>
            <div className="absolute bottom-4 right-4 rounded-[20px] bg-[var(--color-ink)] px-5 py-4 text-white">
              <p className="text-sm font-medium">★ 4.9 средний рейтинг</p>
            </div>
          </div>
        </section>
      </div>

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
          <span className="w-fit rounded-full bg-[var(--color-panel)] px-4 py-1.5 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Поставщики
          </span>
          <h2 className="text-3xl font-semibold md:text-4xl">
            Проверенные поставщики для вашего бизнеса
          </h2>
          <p className="max-w-xl text-[var(--color-ink-soft)]">
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
