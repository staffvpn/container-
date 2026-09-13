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
    { value: popularSuppliers.length, label: "поставщиков" },
    { value: cities.length, label: "городов" },
    { value: categories.length, label: "категорий" },
  ];

  return (
    <main className="flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12 md:py-20">
        <section className="flex flex-col items-center gap-6 text-center">
          <h1 className="max-w-3xl text-5xl leading-[1.05] font-semibold tracking-tight md:text-7xl">
            Найдите поставщика для своего бизнеса
          </h1>
          <p className="max-w-xl text-[var(--color-ink-soft)]">
            Поставщики для кофеен, ресторанов, баров и других заведений HoReCa — в одном месте.
          </p>
          <SearchBar />
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

      <section className="bg-[var(--color-ink)] px-6 py-14 text-[var(--color-paper)]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 text-center sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <span className="text-5xl font-semibold tracking-tight">{stat.value}</span>
              <span className="text-sm text-[color-mix(in_srgb,var(--color-paper)_70%,transparent)]">
                {stat.label}
              </span>
            </div>
          ))}
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
