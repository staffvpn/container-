"use client";

import { useActionState } from "react";
import type { AdminCategory, AdminCity } from "@/lib/admin/queries";
import type { SupplierFormState } from "@/app/admin/suppliers/actions";

const paymentMethodOptions = ["Безналичный расчет", "Карта", "Наличные"];

const statusOptions = [
  { value: "draft", label: "Черновик" },
  { value: "pending", label: "На проверке" },
  { value: "published", label: "Опубликован" },
  { value: "hidden", label: "Скрыт" },
  { value: "rejected", label: "Отклонён" },
  { value: "blocked", label: "Заблокирован" },
  { value: "archived", label: "В архиве" },
];

const verificationOptions = [
  { value: "none", label: "Не подтверждён" },
  { value: "confirmed", label: "Профиль подтверждён" },
  { value: "verified", label: "Проверен Грядкой" },
];

export type AdminSupplierDefaults = {
  name?: string;
  short_description?: string;
  about?: string;
  founded_year?: number | null;
  logo_url?: string | null;
  city_id?: string;
  status?: string;
  verification_level?: string;
  website_url?: string | null;
  telegram?: string | null;
  phone?: string | null;
  email?: string | null;
  contact_notes?: string | null;
  terms_notes?: string | null;
  admin_notes?: string | null;
  min_order?: number | null;
  delivery_available?: boolean;
  pickup_available?: boolean;
  works_with_legal_entities?: boolean;
  works_with_individual_entrepreneurs?: boolean;
  deferred_payment?: boolean;
  payment_methods?: string[];
  category_ids?: string[];
  service_city_ids?: string[];
  created_at?: string;
  updated_at?: string;
};

export function AdminSupplierForm({
  action,
  categories,
  cities,
  defaults,
  submitLabel,
}: {
  action: (state: SupplierFormState, formData: FormData) => Promise<SupplierFormState>;
  categories: AdminCategory[];
  cities: AdminCity[];
  defaults?: AdminSupplierDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const d = defaults ?? {};

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {state.error && (
        <p className="rounded-[var(--radius-sm)] bg-[#fbe9e7] px-4 py-3 text-sm text-[#b3261e]">{state.error}</p>
      )}

      {(d.created_at || d.updated_at) && (
        <p className="text-xs text-[var(--color-ink-soft)]">
          {d.created_at && <>Создан: {new Date(d.created_at).toLocaleString("ru-RU")}. </>}
          {d.updated_at && <>Обновлён: {new Date(d.updated_at).toLocaleString("ru-RU")}.</>}
        </p>
      )}

      <Section title="Основное">
        <Field label="Название компании *">
          <input name="name" defaultValue={d.name} required className={inputClass} />
        </Field>
        <Field label="Краткое описание * (для карточек)">
          <textarea name="short_description" defaultValue={d.short_description} required rows={2} className={inputClass} />
        </Field>
        <Field label="Описание *">
          <textarea name="about" defaultValue={d.about} required rows={5} className={inputClass} />
        </Field>
        <Field label="Год основания">
          <input name="founded_year" type="number" defaultValue={d.founded_year ?? ""} className={inputClass} />
        </Field>
        <Field label="Логотип / фото (URL)">
          <input name="logo_url" defaultValue={d.logo_url ?? ""} placeholder="https://..." className={inputClass} />
        </Field>
      </Section>

      <Section title="Категории и география">
        <Field label="Город (основной) *">
          <select name="city_id" defaultValue={d.city_id} required className={inputClass}>
            <option value="">Выберите город</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm">Регионы работы</legend>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-sm">
                <input type="checkbox" name="service_city_ids" value={c.id} defaultChecked={d.service_city_ids?.includes(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm">Категории</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-sm">
                <input type="checkbox" name="category_ids" value={c.id} defaultChecked={d.category_ids?.includes(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      <Section title="Контакты">
        <Field label="Сайт">
          <input name="website_url" defaultValue={d.website_url ?? ""} className={inputClass} />
        </Field>
        <Field label="Telegram">
          <input name="telegram" defaultValue={d.telegram ?? ""} className={inputClass} />
        </Field>
        <Field label="Телефон">
          <input name="phone" defaultValue={d.phone ?? ""} className={inputClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={d.email ?? ""} className={inputClass} />
        </Field>
        <Field label="Другие способы связи">
          <textarea name="contact_notes" defaultValue={d.contact_notes ?? ""} rows={2} className={inputClass} />
        </Field>
      </Section>

      <Section title="Условия сотрудничества">
        <Field label="Минимальный заказ, ₽">
          <input name="min_order" type="number" defaultValue={d.min_order ?? ""} className={inputClass} />
        </Field>
        <div className="flex flex-wrap gap-4 text-sm">
          <Checkbox name="delivery_available" label="Доставка" defaultChecked={d.delivery_available} />
          <Checkbox name="pickup_available" label="Самовывоз" defaultChecked={d.pickup_available} />
          <Checkbox name="works_with_legal_entities" label="Работа с юрлицами" defaultChecked={d.works_with_legal_entities} />
          <Checkbox name="works_with_individual_entrepreneurs" label="Работа с ИП" defaultChecked={d.works_with_individual_entrepreneurs} />
          <Checkbox name="deferred_payment" label="Отсрочка платежа" defaultChecked={d.deferred_payment} />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm">Способы оплаты</legend>
          <div className="flex flex-wrap gap-2">
            {paymentMethodOptions.map((method) => (
              <label key={method} className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-sm">
                <input type="checkbox" name="payment_methods" value={method} defaultChecked={d.payment_methods?.includes(method)} />
                {method}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Дополнительные условия">
          <textarea name="terms_notes" defaultValue={d.terms_notes ?? ""} rows={2} className={inputClass} />
        </Field>
      </Section>

      <Section title="Статусы">
        <Field label="Статус публикации">
          <select name="status" defaultValue={d.status ?? "draft"} className={inputClass}>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Статус проверки">
          <select name="verification_level" defaultValue={d.verification_level ?? "none"} className={inputClass}>
            {verificationOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Заметки администратора (не видны публично)">
        <textarea name="admin_notes" defaultValue={d.admin_notes ?? ""} rows={3} className={inputClass} />
      </Section>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        {pending ? "Сохранение..." : submitLabel}
      </button>
    </form>
  );
}

const inputClass = "rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
      <legend className="px-1 text-sm font-medium">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
    </label>
  );
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}
