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
        <section className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col items-start gap-6">
            <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight md:text-6xl">
              Найдите поставщика для своего бизнеса
            </h1>
            <p className="max-w-md text-[var(--color-ink-soft)]">
              Поставщики для кофеен, ресторанов, баров и других заведений HoReCa — в одном месте.
            </p>
            <SearchBar />

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-3 rounded-full bg-[var(--color-surface)] py-2 pl-2 pr-4">
                <div className="flex -space-x-2">
                  {["#2C3E67", "#2F5D50", "#7A5C3E"].map((color) => (
                    <span
                      key={color}
                      className="h-8 w-8 rounded-full border-2 border-[var(--color-surface)]"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">★ 4.7 средний рейтинг</span>
              </div>
              <div className="rounded-full bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)]">
                {popularSuppliers.length} проверенных поставщиков
              </div>
            </div>
          </div>

          <div className="flex aspect-[4/5] items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-panel)] text-sm text-[var(--color-ink-soft)]">
            Фото заведения / поставщика
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold">Категории</h2>
          <div className="flex flex-wrap gap-3">
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
