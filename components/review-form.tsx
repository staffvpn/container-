"use client";

import { useState, type FormEvent } from "react";
import { TextField } from "./text-field";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const ratingFields = [
  { key: "overallRating", label: "Общая оценка *" },
  { key: "priceRating", label: "Цена" },
  { key: "qualityRating", label: "Качество" },
  { key: "deliveryRating", label: "Доставка" },
  { key: "serviceRating", label: "Сервис" },
] as const;

export function ReviewForm({ supplierSlug }: { supplierSlug: string }) {
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ratings.overallRating || !comment.trim()) {
      setError("Поставьте общую оценку и напишите комментарий.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setSubmitting(false);
      setError("Войдите через Telegram, чтобы оставить отзыв.");
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ supplierSlug, comment, ...ratings }),
      },
    );

    setSubmitting(false);
    if (!response.ok) {
      setError("Не удалось отправить отзыв. Попробуйте еще раз.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="py-6 text-center font-medium">Отзыв отправлен и появится после проверки.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {ratingFields.map(({ key, label }) => (
        <label key={key} className="flex flex-col gap-1 text-sm">
          {label}
          <select
            value={ratings[key] ?? ""}
            onChange={(e) => setRatings((prev) => ({ ...prev, [key]: e.target.value }))}
            className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
          >
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      ))}
      <TextField label="Комментарий *" value={comment} onChange={setComment} multiline />
      {error && <p className="text-sm text-[#b3261e]">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 self-start rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        {submitting ? "Отправка..." : "Отправить отзыв"}
      </button>
    </form>
  );
}
