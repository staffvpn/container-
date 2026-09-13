import Link from "next/link";
import type { Category } from "@/lib/data/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/suppliers?category=${category.slug}`}
      className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm font-medium hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)]"
    >
      {category.name}
    </Link>
  );
}
