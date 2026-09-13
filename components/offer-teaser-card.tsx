import Link from "next/link";
import type { Offer } from "@/lib/data/types";

export function OfferTeaserCard({ offer, supplierName }: { offer: Offer; supplierName: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
      <div className="flex aspect-[16/10] items-center justify-center rounded-[calc(var(--radius-md)-8px)] bg-[var(--color-panel)] text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
        Акция
      </div>
      <div className="flex flex-col gap-1 px-2 pb-1">
        <p className="text-sm text-[var(--color-ink-soft)]">{supplierName}</p>
        <h3 className="font-semibold">{offer.title}</h3>
        <p className="line-clamp-2 text-sm text-[var(--color-ink-soft)]">{offer.description}</p>
        <Link
          href={`/supplier/${offer.supplierSlug}`}
          className="mt-2 text-sm font-medium text-[var(--color-ink)] underline decoration-[var(--color-accent)] decoration-2 underline-offset-4"
        >
          Подробнее
        </Link>
      </div>
    </div>
  );
}
