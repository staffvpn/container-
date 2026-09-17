import Link from "next/link";
import type { Offer } from "@/lib/data/types";
import { cities } from "@/lib/data/fixtures/cities";
import { categories } from "@/lib/data/fixtures/categories";
import { PromoCodeButton } from "./promo-code-button";

function formatExpiry(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function OfferCard({ offer, supplierName }: { offer: Offer; supplierName: string }) {
  const cityName = offer.city ? cities.find((c) => c.slug === offer.city)?.name : undefined;
  const categoryName = offer.category
    ? categories.find((c) => c.slug === offer.category)?.name
    : undefined;

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-md)] bg-[var(--color-panel)] p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-soft)]">
        {categoryName && (
          <span className="rounded-full bg-[var(--color-surface)] px-3 py-1">{categoryName}</span>
        )}
        {cityName && <span className="rounded-full bg-[var(--color-surface)] px-3 py-1">{cityName}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm text-[var(--color-ink-soft)]">{supplierName}</p>
        <h3 className="text-xl font-semibold">{offer.title}</h3>
      </div>

      <p className="text-[var(--color-ink-soft)]">{offer.description}</p>

      {offer.expiresAt && (
        <p className="text-sm text-[var(--color-ink-soft)]">
          Действует до {formatExpiry(offer.expiresAt)}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {offer.promoCode && (
          <PromoCodeButton code={offer.promoCode} promoCodeId={offer.promoCodeId} supplierId={offer.supplierId} />
        )}
        <Link
          href={`/supplier/${offer.supplierSlug}`}
          className="rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Перейти к поставщику
        </Link>
      </div>
    </div>
  );
}
