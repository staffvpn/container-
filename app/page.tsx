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
  const stats = [
    { value: popularSuppliers.length, label: "поставщиков", highlight: false },
    { value: cities.length, label: "городов", highlight: true },
    { value: categories.length, label: "категорий", highlight: false },
  ];

  return (
    <main className="flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-10 md:py-14">
        <section className="flex flex-col gap-6">
          <div className="relative overflow-visible rounded-[32px] bg-[var(--color-panel)] px-8 py-12 md:px-14 md:py-16">
            <div className="flex max-w-lg flex-col items-start gap-6">
              <h1 className="text-4xl font-semibold uppercase leading-[1.08] tracking-tight md:text-5xl">
                Найдите
                <br />
                <span className="text-[var(--color-ink-soft)]">поставщика для</span>
                <br />
                своего бизнеса
              </h1>
              <p className="text-[var(--color-ink-soft)]">
                Поставщики для кофеен, ресторанов, баров и других заведений HoReCa — в одном месте.
              </p>
              <SearchBar />
            </div>

            <div className="mt-10 flex aspect-[16/9] w-full items-center justify-center rounded-[24px] bg-[var(--color-surface)]/60 text-sm text-[var(--color-ink-soft)] md:absolute md:right-10 md:top-1/2 md:mt-0 md:w-[42%] md:-translate-y-1/2 lg:w-[38%]">
              Фото заведения / поставщика
            </div>
          </div>

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
        </section>

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

      <section className="bg-[var(--color-ink)] px-6 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
          <h2 className="text-2xl font-semibold text-white">Контейнер в цифрах</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`flex min-w-[160px] flex-col gap-1 rounded-[var(--radius-md)] px-8 py-6 ${
                  stat.highlight ? "bg-[var(--color-accent)] text-[var(--color-ink)]" : "bg-white/10 text-white"
                }`}
              >
                <span className="text-4xl font-semibold tracking-tight">{stat.value}</span>
                <span className={`text-sm ${stat.highlight ? "text-[var(--color-ink)]/70" : "text-white/60"}`}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16 md:py-20">
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold">Популярные поставщики</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topSuppliers.map((supplier) => (
              <SupplierCard key={supplier.slug} supplier={supplier} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold">Акции и спецпредложения</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <h2 className="text-2xl font-semibold">Стать поставщиком</h2>
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
