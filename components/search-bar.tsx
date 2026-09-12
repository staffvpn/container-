"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchSuppliers } from "@/lib/data/suppliers";
import type { SearchResult } from "@/lib/data/types";

const emptyResult: SearchResult = { companies: [], categories: [], cities: [] };

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult>(emptyResult);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!value.trim()) {
      setResults(emptyResult);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(() => {
        searchSuppliers(value).then(setResults);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [value]);

  function submit(query: string) {
    setOpen(false);
    router.push(`/suppliers?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="relative w-full max-w-2xl">
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && submit(value)}
          placeholder="Найти поставщика, категорию или услугу"
          className="flex-1 bg-transparent text-base outline-none"
        />
        <button
          onClick={() => submit(value)}
          className="rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 py-2 text-sm text-white"
        >
          Найти
        </button>
      </div>

      {open && value.trim() && (
        <div className="absolute z-20 mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-none">
          {results.companies.length === 0 &&
          results.categories.length === 0 &&
          results.cities.length === 0 ? (
            <p className="px-2 py-1 text-sm text-[var(--color-ink-soft)]">Ничего не найдено</p>
          ) : (
            <>
              {results.companies.length > 0 && (
                <SuggestionGroup label="Компании">
                  {results.companies.map((s) => (
                    <SuggestionItem key={s.slug} onClick={() => router.push(`/supplier/${s.slug}`)}>
                      {s.name}
                    </SuggestionItem>
                  ))}
                </SuggestionGroup>
              )}
              {results.categories.length > 0 && (
                <SuggestionGroup label="Категории">
                  {results.categories.map((c) => (
                    <SuggestionItem key={c.slug} onClick={() => submit(c.name)}>
                      {c.name}
                    </SuggestionItem>
                  ))}
                </SuggestionGroup>
              )}
              {results.cities.length > 0 && (
                <SuggestionGroup label="Города">
                  {results.cities.map((c) => (
                    <SuggestionItem key={c.slug} onClick={() => submit(c.name)}>
                      {c.name}
                    </SuggestionItem>
                  ))}
                </SuggestionGroup>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-2 pb-1 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</p>
      {children}
    </div>
  );
}

function SuggestionItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block w-full rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm hover:bg-[var(--color-paper)]"
    >
      {children}
    </button>
  );
}
