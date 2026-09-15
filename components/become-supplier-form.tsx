"use client";

import { useState, type FormEvent } from "react";
import type { Category, City } from "@/lib/data/types";

const fields = [
  "companyName",
  "contactName",
  "phone",
  "email",
  "website",
  "telegram",
  "city",
  "regions",
  "description",
  "address",
] as const;

type FieldName = (typeof fields)[number];
type FormState = Record<FieldName, string> & { categorySlugs: string[] };

const initialState: FormState = {
  companyName: "",
  contactName: "",
  phone: "",
  email: "",
  website: "",
  telegram: "",
  city: "",
  regions: "",
  description: "",
  address: "",
  categorySlugs: [],
};

const requiredFields: FieldName[] = ["companyName", "contactName", "phone", "email", "city"];

export function BecomeSupplierForm({ categories, cities }: { categories: Category[]; cities: City[] }) {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const missing = requiredFields.filter((field) => !form[field].trim());
    if (missing.length > 0 || form.categorySlugs.length === 0) {
      setError("Заполните обязательные поля и выберите хотя бы одну категорию.");
      return;
    }
    setError(null);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <p className="font-medium">Заявка отправлена. После проверки профиль будет опубликован.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField label="Название компании *" value={form.companyName} onChange={(v) => update("companyName", v)} />
      <TextField label="Имя контактного лица *" value={form.contactName} onChange={(v) => update("contactName", v)} />
      <TextField label="Телефон *" value={form.phone} onChange={(v) => update("phone", v)} />
      <TextField label="Email *" value={form.email} onChange={(v) => update("email", v)} />
      <TextField label="Сайт" value={form.website} onChange={(v) => update("website", v)} />
      <TextField label="Telegram" value={form.telegram} onChange={(v) => update("telegram", v)} />

      <label className="flex flex-col gap-1 text-sm">
        Город *
        <select
          value={form.city}
          onChange={(e) => update("city", e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
        >
          <option value="">Выберите город</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm">Категории *</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = form.categorySlugs.includes(category.slug);
            return (
              <button
                type="button"
                key={category.slug}
                onClick={() =>
                  update(
                    "categorySlugs",
                    active
                      ? form.categorySlugs.filter((slug) => slug !== category.slug)
                      : [...form.categorySlugs, category.slug],
                  )
                }
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  active
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] font-medium text-white"
                    : "border-[var(--color-line)] bg-[var(--color-paper)]"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <TextField label="Регионы доставки" value={form.regions} onChange={(v) => update("regions", v)} />
      <TextField label="Краткое описание" value={form.description} onChange={(v) => update("description", v)} multiline />
      <TextField label="Адрес" value={form.address} onChange={(v) => update("address", v)} />

      {error && <p className="text-sm text-[#b3261e]">{error}</p>}

      <button
        type="submit"
        className="mt-2 self-start rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        Отправить заявку
      </button>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
          rows={3}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
        />
      )}
    </label>
  );
}
