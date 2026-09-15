"use client";

import { useState } from "react";

const issueOptions: { value: string; label: string }[] = [
  { value: "wrong_phone", label: "Неверный телефон" },
  { value: "wrong_website", label: "Неверный сайт" },
  { value: "company_closed", label: "Компания больше не работает" },
  { value: "wrong_address", label: "Неверный адрес" },
  { value: "wrong_category", label: "Неправильная категория" },
  { value: "other", label: "Другое" },
];

export function ErrorReportButton({ supplierSlug }: { supplierSlug: string }) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!issueType) return;
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-error-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierSlug, issueType, comment }),
    });
    setSubmitted(true);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-[var(--color-ink-soft)] underline"
      >
        Сообщить об ошибке
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-md)] bg-[var(--color-panel)] p-6">
            {submitted ? (
              <p className="font-medium">Спасибо, мы проверим информацию.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="font-medium">Сообщить об ошибке</h3>
                {issueOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="issueType"
                      value={opt.value}
                      checked={issueType === opt.value}
                      onChange={() => setIssueType(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Комментарий (необязательно)"
                  className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white"
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
