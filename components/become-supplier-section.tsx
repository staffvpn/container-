"use client";

import { useEffect, useState } from "react";
import { BecomeSupplierForm } from "./become-supplier-form";

export function BecomeSupplierSection() {
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
        className="flex flex-col items-center gap-4 rounded-[var(--radius-md)] bg-[var(--color-panel)] px-8 py-10 text-center"
      >
        <h2 className="text-2xl font-semibold">Стать поставщиком</h2>
        <p className="max-w-md text-[var(--color-ink-soft)]">
          Разместите компанию в Грядке и получайте заявки от заведений HoReCa.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
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
            <BecomeSupplierForm />
          </div>
        </div>
      )}
    </>
  );
}
