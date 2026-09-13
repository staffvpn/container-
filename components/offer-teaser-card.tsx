import Link from "next/link";
import type { Offer } from "@/lib/data/types";

export function OfferTeaserCard({ offer, supplierName }: { offer: Offer; supplierName: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] p-6">
      <p className="text-sm text-[var(--color-ink-soft)]">{supplierName}</p>
      <h3 className="font-semibold">{offer.title}</h3>
      <p className="line-clamp-2 text-sm text-[var(--color-ink-soft)]">{offer.description}</p>
      <Link
        href={`/supplier/${offer.supplierSlug}`}
        className="mt-1 text-sm font-medium text-[var(--color-accent)]"
      >
        Подробнее
      </Link>
    </div>
  );
}
