"use client";

import { useActionState, useState } from "react";
import { submitOwnershipClaim, type ClaimFormState } from "@/app/supplier/[slug]/claim-actions";

export function ClaimOwnershipSection({ supplierSlug }: { supplierSlug: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = submitOwnershipClaim.bind(null, supplierSlug);
  const [state, formAction, pending] = useActionState<ClaimFormState, FormData>(boundAction, {});

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-[var(--color-ink-soft)] underline"
      >
        Это моя компания
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-[var(--radius-md)] bg-[var(--color-surface)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {state.success ? (
              <p className="font-medium">Заявка отправлена. Мы свяжемся с вами после проверки.</p>
            ) : (
              <form action={formAction} className="flex flex-col gap-4">
                <h3 className="font-medium">Заявка «Это моя компания»</h3>
                <label className="flex flex-col gap-1 text-sm">
                  Должность
                  <input name="position" className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Телефон
                  <input name="phone" className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Email
                  <input name="email" type="email" className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Комментарий
                  <textarea name="comment" rows={3} className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2" />
                </label>
                {state.error && <p className="text-sm text-[#b3261e]">{state.error}</p>}
                <button
                  type="submit"
                  disabled={pending}
                  className="self-start rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
                >
                  {pending ? "Отправка..." : "Отправить заявку"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
