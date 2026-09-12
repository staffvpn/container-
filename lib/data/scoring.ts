import type { Supplier } from "./types";

export function scoreSupplier(supplier: Supplier, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const name = supplier.name.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;

  const categoryHit = supplier.categories.some((c) => c.toLowerCase() === q);
  const cityHit = supplier.city.toLowerCase() === q;
  if (categoryHit || cityHit) return 60;

  const haystack = [name, supplier.city, ...supplier.categories, ...supplier.keywords]
    .join(" ")
    .toLowerCase();
  if (haystack.includes(q)) return 30;

  return 0;
}
