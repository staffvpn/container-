import Link from "next/link";
import type { Category } from "@/lib/data/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/suppliers?category=${category.slug}`}
      className="rounded-[var(--radius-md)] border border-[var(--color-line)] px-4 py-6 text-center text-sm font-medium hover:border-[var(--color-ink)]"
    >
      {category.name}
    </Link>
  );
}
