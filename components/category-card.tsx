import Link from "next/link";
import type { Category } from "@/lib/data/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/suppliers?category=${category.slug}`}
      className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white hover:shadow-md"
    >
      {category.name}
    </Link>
  );
}
