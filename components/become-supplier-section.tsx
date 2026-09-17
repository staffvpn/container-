"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BecomeSupplierForm } from "./become-supplier-form";
import type { Category, City } from "@/lib/data/types";

export function BecomeSupplierSection({
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
      <section
        id="become-supplier"
        className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[var(--radius-md)] px-8 py-16 text-center"
      >
        <Image src="/images/become-supplier.jpg" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <h2 className="relative text-2xl font-semibold text-white">Стать поставщиком</h2>
        <p className="relative max-w-md text-white/80">
          Разместите компанию в Грядке и получайте заявки от заведений HoReCa.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="relative rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[var(--color-ink)] transition-transform duration-200 hover:scale-105 hover:opacity-90"
        >
          Оставить заявку
        </button>
      </section>

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
            <h2 className="mb-6 text-xl font-semibold">Стать поставщиком</h2>
            <BecomeSupplierForm categories={categories} cities={cities} />
          </div>
        </div>
      )}
    </>
  );
}
