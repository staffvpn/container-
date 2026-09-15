"use client";

import { useState, type FormEvent } from "react";
import { TextField } from "./text-field";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, City } from "@/lib/data/types";

export function AddSupplierForm({ categories, cities }: { categories: Category[]; cities: City[] }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Укажите название компании.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setSubmitting(false);
      setError("Войдите через Telegram, чтобы добавить поставщика.");
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-suggestion`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ name, website, city, category, comment }),
      },
    );

    setSubmitting(false);
    if (!response.ok) {
      setError("Не удалось отправить. Попробуйте еще раз.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="py-8 text-center font-medium">Спасибо! Мы проверим информацию и добавим поставщика.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField label="Название компании *" value={name} onChange={setName} />
      <TextField label="Сайт" value={website} onChange={setWebsite} />

      <label className="flex flex-col gap-1 text-sm">
        Город
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
        >
          <option value="">Выберите город</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Категория
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
        >
          <option value="">Выберите категорию</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </label>

      <TextField label="Комментарий" value={comment} onChange={setComment} multiline />

      {error && <p className="text-sm text-[#b3261e]">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 self-start rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        {submitting ? "Отправка..." : "Отправить"}
      </button>
    </form>
  );
}
