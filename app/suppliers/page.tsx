import type { Metadata } from "next";
import { getSuppliers, getCategories, getCities } from "@/lib/data/suppliers";
import { SearchBar } from "@/components/search-bar";
import { SupplierCard } from "@/components/supplier-card";
import { FilterPanel } from "@/components/filter-panel";
import { SortDropdown } from "@/components/sort-dropdown";
import { AddSupplierSection } from "@/components/add-supplier-section";
import type { SupplierFilters } from "@/lib/data/types";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Поставщики",
  description: "Найдите поставщика для кофейни, ресторана, бара или другого заведения HoReCa.",
  alternates: { canonical: "/suppliers" },
};

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters: SupplierFilters = {
    city: readParam(params, "city"),
    category: readParam(params, "category"),
    delivery: readParam(params, "delivery") === "1",
    pickup: readParam(params, "pickup") === "1",
    confirmedOnly: readParam(params, "confirmed") === "1",
    query: readParam(params, "q"),
    sort: (readParam(params, "sort") as SupplierFilters["sort"]) ?? "recommended",
  };

  const [suppliers, categories, cities] = await Promise.all([
    getSuppliers(filters),
    getCategories(),
    getCities(),
  ]);

  return (
    <main className="mx-auto flex max-w-[1800px] flex-col gap-8 px-6 py-10 md:px-12 lg:px-20">
      <SearchBar initialQuery={filters.query} />

      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <FilterPanel categories={categories} cities={cities} />
        </aside>

        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--color-ink-soft)]">Найдено: {suppliers.length}</p>
            <SortDropdown />
          </div>

          <AddSupplierSection categories={categories} cities={cities} />

          {suppliers.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-8 text-center">
              <p className="mb-2 font-medium">Ничего не найдено</p>
              <p className="text-sm text-[var(--color-ink-soft)]">Попробуйте изменить фильтры.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((supplier) => (
                <SupplierCard key={supplier.slug} supplier={supplier} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
