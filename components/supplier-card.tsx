import Link from "next/link";
import { SupplierLogo } from "./supplier-logo";
import type { Supplier } from "@/lib/data/types";
import { cities } from "@/lib/data/fixtures/cities";
import { categories } from "@/lib/data/fixtures/categories";

const statusLabel: Record<Supplier["status"], string | null> = {
  unverified: null,
  confirmed: "Профиль подтвержден",
  verified: "Проверен Контейнером",
};

export function SupplierCard({ supplier }: { supplier: Supplier }) {
  const cityName = cities.find((c) => c.slug === supplier.city)?.name ?? supplier.city;
  const categoryNames = supplier.categories
    .map((slug) => categories.find((c) => c.slug === slug)?.name)
    .filter(Boolean);
  const status = statusLabel[supplier.status];
  const conditionParts = [
    supplier.conditions.delivery && "Доставка",
    supplier.conditions.pickup && "Самовывоз",
    supplier.conditions.minOrder &&
      `от ${supplier.conditions.minOrder.toLocaleString("ru-RU")} ₽`,
  ].filter((part): part is string => Boolean(part));

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] p-5">
      <div className="flex items-start gap-3">
        <SupplierLogo name={supplier.name} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{supplier.name}</h3>
          <p className="text-sm text-[var(--color-ink-soft)]">{cityName}</p>
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-[var(--color-ink-soft)]">{supplier.shortDescription}</p>

      {conditionParts.length > 0 && (
        <p className="text-xs text-[var(--color-ink-soft)]">{conditionParts.join(" · ")}</p>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-ink-soft)]">
        {categoryNames.map((name) => (
          <span key={name} className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-2 py-1">
            {name}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-sm">
          ★ {supplier.rating.toFixed(1)}{" "}
          <span className="text-[var(--color-ink-soft)]">({supplier.reviewCount})</span>
          {status && <span className="ml-2 text-[var(--color-ink-soft)]">· {status}</span>}
        </div>
        <Link
          href={`/supplier/${supplier.slug}`}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-1.5 text-sm"
        >
          Открыть
        </Link>
      </div>
    </div>
  );
}
