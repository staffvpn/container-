"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "@/lib/data/fixtures/categories";
import { cities } from "@/lib/data/fixtures/cities";

export function MapFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/map?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Город
        <select
          value={searchParams.get("city") ?? ""}
          onChange={(e) => setParam("city", e.target.value || null)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
        >
          <option value="">Все города</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Категория
        <select
          value={searchParams.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value || null)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={searchParams.get("confirmed") === "1"}
          onChange={() => setParam("confirmed", searchParams.get("confirmed") === "1" ? null : "1")}
          className="accent-[var(--color-accent)]"
        />
        Только подтвержденные
      </label>
    </div>
  );
}
