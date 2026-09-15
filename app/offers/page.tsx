import type { Metadata } from "next";
import { getSuppliers, getOffers } from "@/lib/data/suppliers";
import { OfferCard } from "@/components/offer-card";
import { OffersFilterBar } from "@/components/offers-filter-bar";

export const metadata: Metadata = {
  title: "Предложения — Грядка",
  description: "Акции, скидки и специальные условия от поставщиков для заведений HoReCa.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const category = readParam(params, "category");
  const city = readParam(params, "city");

  const [suppliers, allOffers] = await Promise.all([getSuppliers(), getOffers()]);

  const filteredOffers = allOffers.filter((offer) => {
    if (category && offer.category !== category) return false;
    if (city && offer.city !== city) return false;
    return true;
  });

  return (
    <main className="mx-auto flex max-w-[1800px] flex-col gap-8 px-6 py-10 md:px-12 lg:px-20">
      <div className="flex flex-col gap-4">
        <span className="w-fit rounded-full bg-[var(--color-panel)] px-4 py-1.5 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
          Предложения
        </span>
        <h1 className="text-3xl font-semibold md:text-4xl">Акции и спецпредложения</h1>
        <p className="max-w-xl text-[var(--color-ink-soft)]">
          Скидки, бесплатная доставка и специальные условия от поставщиков — не каталог товаров,
          а реальные предложения для вашего заведения.
        </p>
      </div>

      <OffersFilterBar />

      {filteredOffers.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-8 text-center">
          <p className="font-medium">Предложений не найдено</p>
          <p className="text-sm text-[var(--color-ink-soft)]">Попробуйте изменить фильтры.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => {
            const supplier = suppliers.find((s) => s.slug === offer.supplierSlug);
            return (
              <OfferCard key={offer.id} offer={offer} supplierName={supplier?.name ?? ""} />
            );
          })}
        </div>
      )}
    </main>
  );
}
