import { getSuppliers, getCategories } from "@/lib/data/suppliers";
import { offers } from "@/lib/data/fixtures/offers";
import { cities } from "@/lib/data/fixtures/cities";
import { SearchBar } from "@/components/search-bar";
import { CategoryCard } from "@/components/category-card";
import { SupplierCard } from "@/components/supplier-card";
import { OfferTeaserCard } from "@/components/offer-teaser-card";
import { BecomeSupplierForm } from "@/components/become-supplier-form";

export default async function HomePage() {
  const [categories, popularSuppliers] = await Promise.all([
    getCategories(),
    getSuppliers({ sort: "rating" }),
  ]);
  const topSuppliers = popularSuppliers.slice(0, 6);

  return (
    <main className="flex flex-col">
      <section className="relative w-full overflow-visible bg-[var(--color-panel)] px-6 py-14 md:px-16 md:py-24">
        <div className="relative mx-auto max-w-[1800px]">
          <div className="flex w-full flex-col items-start gap-8 md:w-[58%]">
            <h1 className="text-5xl font-semibold uppercase leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
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

          <div className="mt-14 flex aspect-[4/3] w-full items-center justify-center rounded-[28px] bg-[var(--color-surface)]/60 text-sm text-[var(--color-ink-soft)] md:absolute md:right-0 md:top-1/2 md:mt-0 md:w-[50%] md:-translate-y-1/2 lg:w-[48%]">
            Фото заведения / поставщика
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

        <section
          id="become-supplier"
          className="flex flex-col items-center gap-6 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-8 text-center"
        >
          <h2 className="text-3xl font-semibold md:text-4xl">Стать поставщиком</h2>
          <p className="max-w-xl text-[var(--color-ink-soft)]">
            Разместите компанию в Контейнере и получайте заявки от заведений HoReCa.
          </p>
          <div className="w-full max-w-xl text-left">
            <BecomeSupplierForm />
          </div>
        </section>
      </div>
    </main>
  );
}
