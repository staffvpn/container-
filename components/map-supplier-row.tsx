import Link from "next/link";
import { SupplierLogo } from "./supplier-logo";
import type { Supplier, Category, City } from "@/lib/data/types";

export function MapSupplierRow({
  supplier,
  categories,
  cities,
}: {
  supplier: Supplier;
  categories: Category[];
  cities: City[];
}) {
  const cityName = cities.find((c) => c.slug === supplier.city)?.name ?? supplier.city;
  const badges = supplier.categories
    .map((slug) => categories.find((c) => c.slug === slug)?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 2);

  return (
    <Link
      href={`/supplier/${supplier.slug}`}
      className="flex flex-col gap-2 rounded-[var(--radius-sm)] p-2 hover:bg-[var(--color-panel)]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-sm)]">
        <SupplierLogo name={supplier.name} size="fill" />
        {badges.length > 0 && (
          <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
            {badges.map((label) => (
              <span
                key={label}
                className="rounded-full bg-[var(--color-paper)]/90 px-2 py-0.5 text-[11px] font-medium text-[var(--color-ink)]"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{supplier.name}</p>
        <p className="truncate text-xs text-[var(--color-ink-soft)]">
          {cityName} · ★ {supplier.rating.toFixed(1)}
        </p>
      </div>
    </Link>
  );
}
