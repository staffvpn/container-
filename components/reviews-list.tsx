import type { Review } from "@/lib/data/types";

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-[var(--color-ink-soft)]">Пока нет отзывов.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-[var(--radius-sm)] border border-[var(--color-line)] p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">{review.authorName}</p>
            <p>★ {review.overallRating}</p>
          </div>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{review.comment}</p>
        </div>
      ))}
    </div>
  );
}
