import Link from "next/link";
import { SupplierLogo } from "./supplier-logo";
import { ArrowIconButton } from "./arrow-icon-button";
import type { Supplier } from "@/lib/data/types";
import { cities } from "@/lib/data/fixtures/cities";
import { categories } from "@/lib/data/fixtures/categories";

const statusLabel: Record<Supplier["status"], string | null> = {
  unverified: null,
  confirmed: "Подтверждён",
  verified: "Проверен",
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
    <div className="relative flex flex-col gap-6 rounded-[var(--radius-md)] bg-[var(--color-panel)] p-5 pb-6">
      <div className="relative flex aspect-square items-center justify-center">
        <SupplierLogo name={supplier.name} size="lg" />

        {categoryNames.length > 0 && (
          <div className="absolute bottom-0 left-0 flex flex-col items-start gap-1.5">
            {categoryNames.slice(0, 2).map((name) => (
              <span
                key={name}
                className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-medium"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{supplier.name}</h3>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {cityName} · ★ {supplier.rating.toFixed(1)}
            {status && ` · ${status}`}
          </p>
          {conditionParts.length > 0 && (
            <p className="text-sm text-[var(--color-ink-soft)]">{conditionParts.join(" · ")}</p>
          )}
        </div>
      </div>

      <Link
        href={`/supplier/${supplier.slug}`}
        aria-label={`Открыть профиль ${supplier.name}`}
        className="absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-ink)] hover:opacity-90"
      >
        <ArrowIconButton />
      </Link>
    </div>
  );
}
