import type { Metadata } from "next";
import { getSuppliers, getCities, getCategories, getSupplierMapPoints } from "@/lib/data/suppliers";
import { MapFilterBar } from "@/components/map-filter-bar";
import { MapSupplierRow } from "@/components/map-supplier-row";
import { SupplierMapLoader } from "@/components/supplier-map-loader";
import { CityGate } from "@/components/city-gate";
import type { SupplierFilters } from "@/lib/data/types";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Карта поставщиков",
  description: "Поставщики для HoReCa на карте — фильтр по городу и категории.",
  alternates: { canonical: "/map" },
};

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const citySlug = readParam(params, "city");
  const showAll = readParam(params, "all") === "1";
  const cities = await getCities();

  if (!citySlug && !showAll) {
    return (
      <main className="h-[calc(100dvh-73px)]">
        <CityGate cities={cities} />
      </main>
    );
  }

  const filters: SupplierFilters = {
    city: citySlug,
    category: readParam(params, "category"),
    confirmedOnly: readParam(params, "confirmed") === "1",
  };

  const [suppliers, categories, mapPoints] = await Promise.all([
    getSuppliers(filters),
    getCategories(),
    getSupplierMapPoints(filters),
  ]);
  const focusCity = citySlug ? cities.find((c) => c.slug === citySlug) : undefined;
  const focusCenter: [number, number] | null = focusCity ? [focusCity.lat, focusCity.lng] : null;

  return (
    <main className="flex h-[calc(100dvh-73px)] flex-col md:flex-row">
      <aside className="flex w-full flex-col gap-4 overflow-y-auto border-b border-[var(--color-line)] p-6 md:h-full md:w-[360px] md:border-b-0 md:border-r">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Карта поставщиков</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">Найдено: {suppliers.length}</p>
        </div>

        <MapFilterBar />

        <div className="border-t border-[var(--color-line)] pt-3">
          {suppliers.length === 0 ? (
            <p className="p-3 text-sm text-[var(--color-ink-soft)]">Ничего не найдено.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {suppliers.map((supplier) => (
                <MapSupplierRow
                  key={supplier.slug}
                  supplier={supplier}
                  categories={categories}
                  cities={cities}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="h-[400px] flex-1 md:h-full">
        <SupplierMapLoader points={mapPoints} focusCenter={focusCenter} />
      </div>
    </main>
  );
}
