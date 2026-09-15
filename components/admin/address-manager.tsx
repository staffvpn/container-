"use client";

import { useActionState, useState, useTransition } from "react";
import type { AdminCity } from "@/lib/admin/queries";
import {
  addAddress,
  deleteAddress,
  setPrimaryAddress,
  setManualCoordinates,
  type AddressFormState,
} from "@/app/admin/suppliers/[id]/addresses-actions";

export type AdminAddress = {
  id: string;
  label: string | null;
  address: string;
  city_id: string | null;
  region: string | null;
  postal_code: string | null;
  lat: number;
  lng: number;
  working_hours: string | null;
  phone: string | null;
  pickup_available: boolean;
  comment: string | null;
  is_primary: boolean;
  geocoding_status: "pending" | "success" | "failed" | "manual";
};

const inputClass = "rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm";

export function AddressManager({
  supplierId,
  addresses,
  cities,
}: {
  supplierId: string;
  addresses: AdminAddress[];
  cities: AdminCity[];
}) {
  const boundAdd = addAddress.bind(null, supplierId);
  const [state, formAction, pending] = useActionState<AddressFormState, FormData>(boundAdd, {});

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)]">Адресов пока нет.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((a) => (
            <AddressRow key={a.id} supplierId={supplierId} address={a} cities={cities} />
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
        <p className="text-sm font-medium">Добавить адрес</p>
        {state.error && <p className="text-sm text-[#b3261e]">{state.error}</p>}
        {state.warning && <p className="text-sm text-[#9a6a1f]">{state.warning}</p>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Тип адреса
            <input name="label" placeholder="Офис, склад, магазин..." className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Город
            <select name="city_id" className={inputClass}>
              <option value="">—</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Полный адрес *
          <input name="address" required className={inputClass} />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Регион
            <input name="region" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Индекс
            <input name="postal_code" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Часы работы
            <input name="working_hours" placeholder="Пн-Пт 9:00-18:00" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Телефон точки
            <input name="phone" className={inputClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Комментарий
          <textarea name="comment" rows={2} className={inputClass} />
        </label>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="pickup_available" />
            Доступен самовывоз
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_primary" />
            Основной адрес
          </label>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-[var(--color-ink-soft)]">
            Указать координаты вручную (если адрес не геокодируется)
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <input name="manual_lat" type="number" step="any" placeholder="Широта" className={inputClass} />
            <input name="manual_lng" type="number" step="any" placeholder="Долгота" className={inputClass} />
          </div>
        </details>

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {pending ? "Сохранение..." : "Добавить адрес"}
        </button>
      </form>
    </div>
  );
}

function AddressRow({
  supplierId,
  address,
  cities,
}: {
  supplierId: string;
  address: AdminAddress;
  cities: AdminCity[];
}) {
  const [pending, startTransition] = useTransition();
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const cityName = cities.find((c) => c.id === address.city_id)?.name;

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {address.label && <span className="mr-2 rounded-full bg-[var(--color-panel)] px-2 py-0.5 text-xs">{address.label}</span>}
            {address.is_primary && (
              <span className="mr-2 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs text-[var(--color-accent)]">Основной</span>
            )}
            {address.address}
          </p>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {[cityName, address.region, address.postal_code].filter(Boolean).join(", ")}
          </p>
          {address.working_hours && <p className="text-sm text-[var(--color-ink-soft)]">{address.working_hours}</p>}
          {address.pickup_available && <p className="text-sm text-[var(--color-accent)]">Самовывоз доступен</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          {!address.is_primary && (
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => setPrimaryAddress(supplierId, address.id))}
              className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
            >
              Сделать основным
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm("Удалить этот адрес?")) startTransition(() => deleteAddress(supplierId, address.id));
            }}
            className="rounded-full border border-[#b3261e] px-3 py-1 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
          >
            Удалить
          </button>
        </div>
      </div>

      {address.geocoding_status === "failed" && (
        <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] bg-[#fbe9e7] p-3 text-sm">
          <p className="text-[#b3261e]">
            ⚠ Не удалось определить координаты автоматически. Метка на карте не появится, пока координаты не
            заданы вручную.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="Широта"
              className={`${inputClass} w-32`}
            />
            <input
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="Долгота"
              className={`${inputClass} w-32`}
            />
            <button
              type="button"
              disabled={pending || !manualLat || !manualLng}
              onClick={() =>
                startTransition(() =>
                  setManualCoordinates(supplierId, address.id, Number(manualLat), Number(manualLng)),
                )
              }
              className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-xs font-medium text-white"
            >
              Сохранить координаты
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
