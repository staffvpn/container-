import { describe, it, expect } from "vitest";
import { scoreSupplier } from "./scoring";
import { suppliers } from "./fixtures/suppliers";

const rosteryNord = suppliers.find((s) => s.slug === "rostery-nord")!;

describe("scoreSupplier", () => {
  it("scores an exact name match highest", () => {
    const exact = scoreSupplier(rosteryNord, "Rostery Nord");
    const prefix = scoreSupplier(rosteryNord, "Rostery");
    expect(exact).toBeGreaterThan(prefix);
  });

  it("scores a category match above a keyword substring match", () => {
    const categoryScore = scoreSupplier(rosteryNord, "coffee-tea");
    const substringScore = scoreSupplier(rosteryNord, "бариста");
    expect(categoryScore).toBeGreaterThan(substringScore);
  });

  it("returns 0 for no match", () => {
    expect(scoreSupplier(rosteryNord, "мебель")).toBe(0);
  });

  it("returns 0 for an empty query", () => {
    expect(scoreSupplier(rosteryNord, "")).toBe(0);
  });
});
