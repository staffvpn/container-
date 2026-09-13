"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchSuppliers } from "@/lib/data/suppliers";
import type { SearchResult } from "@/lib/data/types";

const emptyResult: SearchResult = { companies: [], categories: [], cities: [] };

const popularQueries = ["Поставщики кофе в Москве", "Упаковка с доставкой"];

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function submit(query: string) {
    setOpen(false);
    router.push(`/suppliers?q=${encodeURIComponent(query)}`);
  }

  const hasStructuredResults =
    results.companies.length > 0 || results.categories.length > 0 || results.cities.length > 0;

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] py-2 pl-6 pr-2">
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
          aria-label="Найти"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-white"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 16L13 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && value.trim() && (
        <div className="absolute z-20 mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
          {!hasStructuredResults && (
            <p className="px-2 py-1 text-sm text-[var(--color-ink-soft)]">Ничего не найдено</p>
          )}
          {results.companies.length > 0 && (
            <SuggestionGroup label="Компании">
              {results.companies.map((s) => (
                <SuggestionItem
                  key={s.slug}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/supplier/${s.slug}`);
                  }}
                >
                  {s.name}
                </SuggestionItem>
              ))}
            </SuggestionGroup>
          )}
          {results.categories.length > 0 && (
            <SuggestionGroup label="Категории">
              {results.categories.map((c) => (
                <SuggestionItem
                  key={c.slug}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/suppliers?category=${c.slug}`);
                  }}
                >
                  {c.name}
                </SuggestionItem>
              ))}
            </SuggestionGroup>
          )}
          {results.cities.length > 0 && (
            <SuggestionGroup label="Города">
              {results.cities.map((c) => (
                <SuggestionItem
                  key={c.slug}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/suppliers?city=${c.slug}`);
                  }}
                >
                  {c.name}
                </SuggestionItem>
              ))}
            </SuggestionGroup>
          )}
          <SuggestionGroup label="Популярные запросы">
            {popularQueries.map((query) => (
              <SuggestionItem key={query} onClick={() => submit(query)}>
                {query}
              </SuggestionItem>
            ))}
          </SuggestionGroup>
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
