import { describe, it, expect } from "vitest";
import { suppliers } from "./suppliers";
import { categories } from "./categories";
import { cities } from "./cities";
import { offers } from "./offers";

describe("fixtures", () => {
  it("has at least 15 suppliers with unique slugs", () => {
    expect(suppliers.length).toBeGreaterThanOrEqual(15);
    const slugs = new Set(suppliers.map((s) => s.slug));
    expect(slugs.size).toBe(suppliers.length);
  });

  it("only references categories that exist", () => {
    const validSlugs = new Set(categories.map((c) => c.slug));
    for (const supplier of suppliers) {
      for (const categorySlug of supplier.categories) {
        expect(validSlugs.has(categorySlug)).toBe(true);
      }
    }
  });

  it("only references cities that exist", () => {
    const validSlugs = new Set(cities.map((c) => c.slug));
    for (const supplier of suppliers) {
      expect(validSlugs.has(supplier.city)).toBe(true);
      for (const region of supplier.regions) {
        expect(validSlugs.has(region)).toBe(true);
      }
    }
  });

  it("only references suppliers that exist in offers", () => {
    const validSlugs = new Set(suppliers.map((s) => s.slug));
    for (const offer of offers) {
      expect(validSlugs.has(offer.supplierSlug)).toBe(true);
    }
  });
});
