"use client";

import { useActionState, useTransition } from "react";
import { createNews, updateNewsStatus, deleteNews, type NewsFormState } from "@/app/admin/suppliers/[id]/news-actions";

export type NewsItem = {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  published: "Опубликовано",
  archived: "В архиве",
};

export function NewsManager({ supplierId, news }: { supplierId: string; news: NewsItem[] }) {
  const boundCreate = createNews.bind(null, supplierId);
  const [state, formAction, pending] = useActionState<NewsFormState, FormData>(boundCreate, {});
  const [actionPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {news.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)]">Новостей пока нет.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {news.map((n) => (
            <div key={n.id} className="rounded-[var(--radius-sm)] border border-[var(--color-line)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {n.title}{" "}
                    <span className="rounded-full bg-[var(--color-panel)] px-2 py-0.5 text-xs">{statusLabels[n.status] ?? n.status}</span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{n.content}</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{new Date(n.created_at).toLocaleDateString("ru-RU")}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {n.status !== "published" && (
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() => startTransition(() => updateNewsStatus(supplierId, n.id, "published"))}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
                    >
                      Опубликовать
                    </button>
                  )}
                  {n.status === "published" && (
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() => startTransition(() => updateNewsStatus(supplierId, n.id, "archived"))}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
                    >
                      В архив
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={() => {
                      if (confirm("Удалить новость?")) startTransition(() => deleteNews(supplierId, n.id));
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
        <p className="text-sm font-medium">Добавить новость</p>
        {state.error && <p className="text-sm text-[#b3261e]">{state.error}</p>}
        <input
          name="title"
          placeholder="Заголовок"
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
        />
        <textarea
          name="content"
          placeholder="Текст новости"
          rows={3}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {pending ? "Сохранение..." : "Опубликовать новость"}
        </button>
      </form>
    </div>
  );
}
