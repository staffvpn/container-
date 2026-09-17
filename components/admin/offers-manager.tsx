"use client";

import { useActionState, useTransition } from "react";
import type { AdminCategory } from "@/lib/admin/queries";
import { createOffer, updateOfferStatus, deleteOffer, type OfferFormState } from "@/app/admin/suppliers/[id]/offers-actions";

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  published: "Опубликовано",
  archived: "В архиве",
};

export type OfferItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  expires_at: string | null;
  promoCode?: { code: string; copyCount: number } | null;
};

const inputClass = "rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm";

export function OffersManager({
  supplierId,
  offers,
  categories,
}: {
  supplierId: string;
  offers: OfferItem[];
  categories: AdminCategory[];
}) {
  const boundCreate = createOffer.bind(null, supplierId);
  const [state, formAction, pending] = useActionState<OfferFormState, FormData>(boundCreate, {});
  const [actionPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {offers.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)]">Предложений пока нет.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {offers.map((o) => (
            <div key={o.id} className="rounded-[var(--radius-sm)] border border-[var(--color-line)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {o.title}{" "}
                    <span className="rounded-full bg-[var(--color-panel)] px-2 py-0.5 text-xs">{statusLabels[o.status] ?? o.status}</span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{o.description}</p>
                  {o.expires_at && (
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)]">До {new Date(o.expires_at).toLocaleDateString("ru-RU")}</p>
                  )}
                  {o.promoCode && (
                    <p className="mt-1 text-xs text-[var(--color-accent)]">
                      Промокод «{o.promoCode.code}» — скопирован {o.promoCode.copyCount} раз
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {o.status !== "published" && (
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() => startTransition(() => updateOfferStatus(supplierId, o.id, "published"))}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
                    >
                      Опубликовать
                    </button>
                  )}
                  {o.status === "published" && (
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() => startTransition(() => updateOfferStatus(supplierId, o.id, "archived"))}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
                    >
                      В архив
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={() => {
                      if (confirm("Удалить предложение?")) startTransition(() => deleteOffer(supplierId, o.id));
                    }}
                    className="rounded-full border border-[#b3261e] px-3 py-1 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
        <p className="text-sm font-medium">Добавить предложение</p>
        {state.error && <p className="text-sm text-[#b3261e]">{state.error}</p>}
        <input name="title" placeholder="Название" className={inputClass} />
        <textarea name="description" placeholder="Описание" rows={2} className={inputClass} />
        <textarea name="terms" placeholder="Условия (необязательно)" rows={2} className={inputClass} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select name="category_id" className={inputClass}>
            <option value="">Без категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="expires_at" type="date" className={inputClass} />
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-[var(--color-ink-soft)]">Добавить промокод (необязательно)</summary>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input name="promo_code" placeholder="Код, напр. GRYADKA10" className={inputClass} />
            <input name="promo_discount" placeholder="Скидка, напр. -10%" className={inputClass} />
            <input name="promo_min_order" type="number" placeholder="Мин. сумма заказа" className={inputClass} />
            <input name="promo_max_uses" type="number" placeholder="Лимит использований" className={inputClass} />
            <input name="promo_starts_at" type="date" className={inputClass} />
            <input name="promo_ends_at" type="date" className={inputClass} />
            <textarea name="promo_terms" placeholder="Условия промокода" rows={2} className={`${inputClass} sm:col-span-2`} />
          </div>
        </details>

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {pending ? "Сохранение..." : "Добавить предложение"}
        </button>
      </form>
    </div>
  );
}
