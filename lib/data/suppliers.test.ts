import { describe, it, expect } from "vitest";
import { getSuppliers, getSupplierBySlug, getCategories, searchSuppliers } from "./suppliers";

describe("getSuppliers", () => {
  it("returns all suppliers with no filters", async () => {
    const result = await getSuppliers();
    expect(result.length).toBeGreaterThanOrEqual(15);
  });

  it("filters by city", async () => {
    const result = await getSuppliers({ city: "krasnodar" });
    expect(result.every((s) => s.city === "krasnodar" || s.regions.includes("krasnodar"))).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("filters by category", async () => {
    const result = await getSuppliers({ category: "coffee-tea" });
    expect(result.every((s) => s.categories.includes("coffee-tea"))).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("combines a text query with a city filter", async () => {
    const result = await getSuppliers({ city: "moscow", query: "кофе" });
    expect(result.every((s) => s.city === "moscow" || s.regions.includes("moscow"))).toBe(true);
  });

  it("returns an empty array when nothing matches", async () => {
    const result = await getSuppliers({ query: "несуществующий запрос xyz" });
    expect(result).toEqual([]);
  });

  it("sorts by rating when requested", async () => {
    const result = await getSuppliers({ sort: "rating" });
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].rating).toBeGreaterThanOrEqual(result[i].rating);
    }
  });
});

describe("getSupplierBySlug", () => {
  it("finds an existing supplier", async () => {
    const result = await getSupplierBySlug("rostery-nord");
    expect(result?.name).toBe("Rostery Nord");
  });

  it("returns null for an unknown slug", async () => {
    const result = await getSupplierBySlug("does-not-exist");
    expect(result).toBeNull();
  });
});

describe("getCategories", () => {
  it("returns the full category list", async () => {
    const result = await getCategories();
    expect(result.length).toBeGreaterThanOrEqual(10);
  });
});

describe("searchSuppliers", () => {
  it("groups matches into companies, categories, and cities", async () => {
    const result = await searchSuppliers("кофе");
    expect(result.companies.length).toBeGreaterThan(0);
    expect(result.categories.some((c) => c.slug === "coffee-tea")).toBe(true);
  });
});
