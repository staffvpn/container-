import Link from "next/link";
import { SupplierLogo } from "./supplier-logo";
import type { Supplier } from "@/lib/data/types";
import { cities } from "@/lib/data/fixtures/cities";

export function MapSupplierRow({ supplier }: { supplier: Supplier }) {
  const cityName = cities.find((c) => c.slug === supplier.city)?.name ?? supplier.city;

  return (
    <Link
      href={`/supplier/${supplier.slug}`}
      className="flex items-center gap-3 rounded-[var(--radius-sm)] p-3 hover:bg-[var(--color-panel)]"
    >
      <SupplierLogo name={supplier.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{supplier.name}</p>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {cityName} · ★ {supplier.rating.toFixed(1)}
        </p>
      </div>
    </Link>
  );
}
