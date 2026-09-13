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
    .filter((name): name is string => Boolean(name));
  const status = statusLabel[supplier.status];
  const conditionParts = [
    supplier.conditions.delivery && "Доставка",
    supplier.conditions.pickup && "Самовывоз",
    supplier.conditions.minOrder &&
      `от ${supplier.conditions.minOrder.toLocaleString("ru-RU")} ₽`,
  ].filter((part): part is string => Boolean(part));

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
      <div className="relative flex aspect-[4/3] items-center justify-center rounded-[calc(var(--radius-md)-8px)] bg-[var(--color-panel)]">
        <SupplierLogo name={supplier.name} size="lg" />
        {categoryNames.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {categoryNames.slice(0, 2).map((name) => (
              <span
                key={name}
                className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium"
              >
                {name}
              </span>
            ))}
          </div>
        )}
        {status && (
          <span className="absolute right-3 top-3 rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink)]">
            {status === "Проверен Контейнером" ? "Проверен" : "Подтверждён"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 px-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold">{supplier.name}</h3>
          <span className="shrink-0 text-sm">★ {supplier.rating.toFixed(1)}</span>
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {cityName}
          <span className="text-[var(--color-ink-soft)]"> · {supplier.reviewCount} отзывов</span>
        </p>
        {conditionParts.length > 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">{conditionParts.join(" · ")}</p>
        )}
      </div>

      <Link
        href={`/supplier/${supplier.slug}`}
        className="rounded-full bg-[var(--color-ink)] px-2 py-3 text-center text-sm font-medium text-white hover:opacity-90"
      >
        Открыть
      </Link>
    </div>
  );
}
