"use client";

import { useRouter } from "next/navigation";
import type { City } from "@/lib/data/types";

export function CityGate({ cities }: { cities: City[] }) {
  const router = useRouter();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Из какого вы города?</h1>
        <p className="text-[var(--color-ink-soft)]">Покажем поставщиков рядом с вами</p>
      </div>

      <div className="flex max-w-2xl flex-wrap justify-center gap-2">
        {cities.map((city) => (
          <button
            key={city.slug}
            type="button"
            onClick={() => router.push(`/map?city=${city.slug}`)}
            className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            {city.name}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.push("/map?all=1")}
        className="text-sm text-[var(--color-ink-soft)] underline"
      >
        Показать все города
      </button>
    </div>
  );
}
