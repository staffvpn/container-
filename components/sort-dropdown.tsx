"use client";

import { useRouter, useSearchParams } from "next/navigation";

const options = [
  { value: "recommended", label: "Рекомендуемые" },
  { value: "rating", label: "По рейтингу" },
  { value: "new", label: "Сначала новые" },
  { value: "updated", label: "Недавно обновленные" },
];

export function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "recommended") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`/suppliers?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      Сортировка
      <select
        value={searchParams.get("sort") ?? "recommended"}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
