"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "@/lib/data/fixtures/categories";
import { cities } from "@/lib/data/fixtures/cities";

export function OffersFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/offers?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={searchParams.get("category") ?? ""}
        onChange={(e) => setParam("category", e.target.value || null)}
        className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2 text-sm"
      >
        <option value="">Все категории</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("city") ?? ""}
        onChange={(e) => setParam("city", e.target.value || null)}
        className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2 text-sm"
      >
        <option value="">Все города</option>
        {cities.map((city) => (
          <option key={city.slug} value={city.slug}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}
