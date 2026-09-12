import { suppliers as allSuppliers } from "./fixtures/suppliers";
import { categories as allCategories } from "./fixtures/categories";
import { cities as allCities } from "./fixtures/cities";
import { offers as allOffers } from "./fixtures/offers";
import { scoreSupplier } from "./scoring";
import type { Supplier, Category, City, Offer, SupplierFilters, SearchResult } from "./types";

export async function getSuppliers(filters: SupplierFilters = {}): Promise<Supplier[]> {
  let result = allSuppliers.slice();

  if (filters.city) {
    const city = filters.city;
    result = result.filter((s) => s.city === city || s.regions.includes(city));
  }
  if (filters.category) {
    result = result.filter((s) => s.categories.includes(filters.category!));
  }
  if (filters.delivery) {
    result = result.filter((s) => s.conditions.delivery);
  }
  if (filters.pickup) {
    result = result.filter((s) => s.conditions.pickup);
  }
  if (filters.confirmedOnly) {
    result = result.filter((s) => s.status !== "unverified");
  }
  if (filters.query) {
    result = result
      .map((s) => ({ supplier: s, score: scoreSupplier(s, filters.query!) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.supplier);
  }

  switch (filters.sort) {
    case "rating":
      result = result.slice().sort((a, b) => b.rating - a.rating);
      break;
    case "new":
      result = result.slice().sort((a, b) => (b.foundedYear ?? 0) - (a.foundedYear ?? 0));
      break;
    case "updated":
      result = result.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      break;
    default:
      break;
  }

  return result;
}

export async function getSupplierBySlug(slug: string): Promise<Supplier | null> {
  return allSuppliers.find((s) => s.slug === slug) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  return allCategories.slice();
}

export async function getCities(): Promise<City[]> {
  return allCities.slice();
}

export async function getOffers(supplierSlug?: string): Promise<Offer[]> {
  if (supplierSlug) {
    return allOffers.filter((o) => o.supplierSlug === supplierSlug);
  }
  return allOffers.slice();
}

export async function searchSuppliers(query: string): Promise<SearchResult> {
  const q = query.trim().toLowerCase();
  if (!q) return { companies: [], categories: [], cities: [] };

  const companies = allSuppliers
    .map((s) => ({ supplier: s, score: scoreSupplier(s, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => r.supplier);

  const categoryMatches = allCategories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5);
  const cityMatches = allCities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5);

  return { companies, categories: categoryMatches, cities: cityMatches };
}
