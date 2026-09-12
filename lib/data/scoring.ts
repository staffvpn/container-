import type { Supplier } from "./types";
import { cities } from "./fixtures/cities";
import { categories } from "./fixtures/categories";

const cityNameBySlug = new Map(cities.map((c) => [c.slug, c.name.toLowerCase()]));
const categoryNameBySlug = new Map(categories.map((c) => [c.slug, c.name.toLowerCase()]));

export function scoreSupplier(supplier: Supplier, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const name = supplier.name.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;

  const cityName = cityNameBySlug.get(supplier.city) ?? supplier.city.toLowerCase();
  const categoryNames = supplier.categories.map(
    (slug) => categoryNameBySlug.get(slug) ?? slug.toLowerCase()
  );

  const categoryHit =
    supplier.categories.some((c) => c.toLowerCase() === q) || categoryNames.some((n) => n === q);
  const cityHit = supplier.city.toLowerCase() === q || cityName === q;
  if (categoryHit || cityHit) return 60;

  const haystack = [
    name,
    supplier.city,
    cityName,
    ...supplier.categories,
    ...categoryNames,
    ...supplier.keywords,
  ]
    .join(" ")
    .toLowerCase();
  if (haystack.includes(q)) return 30;

  return 0;
}
