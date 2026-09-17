"use client";

import { useState } from "react";
import { submitComplaint } from "@/app/complaint-actions";

const reasonOptions: { value: string; label: string }[] = [
  { value: "fraud", label: "Мошенничество" },
  { value: "not_exists", label: "Компания не существует" },
  { value: "wrong_info", label: "Неверная информация" },
  { value: "spam", label: "Спам" },
  { value: "rules_violation", label: "Нарушение правил" },
  { value: "other", label: "Другое" },
];

export function ComplaintButton({
  entityType,
  entityId,
}: {
  entityType: "supplier" | "offer" | "review";
  entityId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitComplaint(entityType, entityId, reason, description);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить жалобу.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-[var(--color-ink-soft)] underline">
        Пожаловаться
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-[var(--radius-md)] bg-[var(--color-panel)] p-6" onClick={(e) => e.stopPropagation()}>
            {submitted ? (
              <p className="font-medium">Спасибо, мы рассмотрим жалобу.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="font-medium">Пожаловаться</h3>
                {reasonOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="reason" value={opt.value} checked={reason === opt.value} onChange={() => setReason(opt.value)} />
                    {opt.label}
                  </label>
                ))}
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Комментарий (необязательно)"
                  className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
                  rows={3}
                />
                {error && <p className="text-sm text-[#b3261e]">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!reason || submitting}
                    onClick={handleSubmit}
                    className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Отправить
                  </button>
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm">
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
