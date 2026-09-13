import Image from "next/image";
import { getSuppliers, getCategories } from "@/lib/data/suppliers";
import { offers } from "@/lib/data/fixtures/offers";
import { cities } from "@/lib/data/fixtures/cities";
import { SearchBar } from "@/components/search-bar";
import { CategoryCard } from "@/components/category-card";
import { SupplierCard } from "@/components/supplier-card";
import { OfferTeaserCard } from "@/components/offer-teaser-card";
import { BecomeSupplierSection } from "@/components/become-supplier-section";

export default async function HomePage() {
  const [categories, popularSuppliers] = await Promise.all([
    getCategories(),
    getSuppliers({ sort: "rating" }),
  ]);
  const topSuppliers = popularSuppliers.slice(0, 6);

  return (
    <main className="flex flex-col">
      <section className="relative flex min-h-[560px] w-full items-center overflow-hidden bg-[var(--color-panel)] px-6 py-14 text-sm text-[var(--color-ink-soft)] md:min-h-[680px] md:px-16">
        <Image
          src="/images/hero-farm.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/10 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-[1800px]">
          <div className="flex w-full max-w-xl flex-col items-start gap-8 rounded-[32px] bg-[var(--color-surface)]/90 p-8 backdrop-blur md:p-10">
            <h1 className="text-5xl font-semibold uppercase leading-[1.05] tracking-tight text-[var(--color-ink)] md:text-6xl lg:text-7xl">
              Найдите
              <br />
              <span className="text-[var(--color-ink-soft)]">поставщика</span> для
              <br />
              своего бизнеса
            </h1>
            <p className="max-w-md text-lg text-[var(--color-ink-soft)]">
              Поставщики для кофеен, ресторанов, баров и других заведений HoReCa — в одном месте.
            </p>
            <SearchBar />
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-24 px-6 py-12 md:px-12 md:py-16 lg:px-20">
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] py-2 pl-2 pr-4">
            <div className="flex -space-x-2">
              {["#2C3E67", "#2F5D50", "#7A5C3E"].map((color) => (
                <span
                  key={color}
                  className="h-8 w-8 rounded-full border-2 border-[var(--color-surface)]"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-sm font-medium">★ 4.9 · {popularSuppliers.length}+ поставщиков</span>
          </div>

          <div className="flex gap-3">
            <div className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5 text-sm">
              <span className="font-semibold">{categories.length}+</span>{" "}
              <span className="text-[var(--color-ink-soft)]">категорий</span>
            </div>
            <div className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm text-[var(--color-ink)]">
              <span className="font-semibold">{cities.length}+</span> городов
            </div>
          </div>
        </div>

        <section className="flex flex-col items-center gap-6 text-center">
          <span className="rounded-full bg-[var(--color-panel)] px-4 py-1.5 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Категории
          </span>
          <h2 className="text-3xl font-semibold">Найдите поставщика по категории</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </section>
      </div>

      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-20 px-6 py-20 md:px-12 md:py-24 lg:px-20">
        <section className="flex flex-col gap-6">
          <h2 className="text-3xl font-semibold md:text-4xl">Популярные поставщики</h2>
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

        <BecomeSupplierSection />
      </div>
    </main>
  );
}
