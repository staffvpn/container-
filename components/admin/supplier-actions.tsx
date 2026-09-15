"use client";

import { useTransition } from "react";
import {
  setSupplierStatus,
  softDeleteSupplier,
  restoreSupplier,
  hardDeleteSupplier,
} from "@/app/admin/suppliers/actions";

export function AdminSupplierActions({
  supplierId,
  status,
  isDeleted,
}: {
  supplierId: string;
  status: string;
  isDeleted: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(() => {
      action();
    });
  }

  if (isDeleted) {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => restoreSupplier(supplierId))}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
        >
          Восстановить
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Удалить безвозвратно? Это действие нельзя отменить.")) {
              run(() => hardDeleteSupplier(supplierId));
            }
          }}
          className="rounded-full border border-[#b3261e] px-3 py-1 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
        >
          Удалить навсегда
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "published" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setSupplierStatus(supplierId, "published"))}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-accent)]"
        >
          Опубликовать
        </button>
      )}
      {status !== "hidden" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setSupplierStatus(supplierId, "hidden"))}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
        >
          Скрыть
        </button>
      )}
      {status !== "blocked" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setSupplierStatus(supplierId, "blocked"))}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
        >
          Заблокировать
        </button>
      )}
      {status !== "archived" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setSupplierStatus(supplierId, "archived"))}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
        >
          В архив
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Перенести поставщика в удалённые?")) {
            run(() => softDeleteSupplier(supplierId));
          }
        }}
        className="rounded-full border border-[#b3261e] px-3 py-1 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
      >
        Удалить
      </button>
    </div>
  );
}
