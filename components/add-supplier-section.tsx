"use client";

import { useEffect, useState } from "react";
import { AddSupplierForm } from "./add-supplier-form";
import type { Category, City } from "@/lib/data/types";

export function AddSupplierSection({
  categories,
  cities,
}: {
  categories: Category[];
  cities: City[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-[var(--color-accent)] underline"
      >
        Не нашли поставщика? Добавьте его.
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[var(--radius-md)] bg-[var(--color-surface)] p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Закрыть"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] hover:border-[var(--color-ink)]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <h2 className="mb-6 text-xl font-semibold">Добавить поставщика</h2>
            <AddSupplierForm categories={categories} cities={cities} />
          </div>
        </div>
      )}
    </>
  );
}
