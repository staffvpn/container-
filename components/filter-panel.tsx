"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "@/lib/data/fixtures/categories";
import { cities } from "@/lib/data/fixtures/cities";

const booleanFilters = [
  { key: "delivery", label: "Доставка" },
  { key: "pickup", label: "Самовывоз" },
  { key: "confirmed", label: "Подтвержденный профиль" },
] as const;

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMore, setShowMore] = useState(false);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/suppliers?${params.toString()}`);
  }

  function toggleBoolean(key: string) {
    setParam(key, searchParams.get(key) === "1" ? null : "1");
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <label className="flex flex-col gap-1">
        Город
        <select
          value={searchParams.get("city") ?? ""}
          onChange={(e) => setParam("city", e.target.value || null)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2"
        >
          <option value="">Все города</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        Категория
        <select
          value={searchParams.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value || null)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2"
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {booleanFilters.slice(0, 1).map((filter) => (
        <BooleanCheckbox
          key={filter.key}
          label={filter.label}
          checked={searchParams.get(filter.key) === "1"}
          onChange={() => toggleBoolean(filter.key)}
        />
      ))}

      {showMore ? (
        booleanFilters.slice(1).map((filter) => (
          <BooleanCheckbox
            key={filter.key}
            label={filter.label}
            checked={searchParams.get(filter.key) === "1"}
            onChange={() => toggleBoolean(filter.key)}
          />
        ))
      ) : (
        <button type="button" onClick={() => setShowMore(true)} className="text-left text-[var(--color-accent)]">
          Ещё фильтры
        </button>
      )}
    </div>
  );
}

function BooleanCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
