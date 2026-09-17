"use client";

import { useState, useTransition } from "react";
import {
  approveReview,
  hideReview,
  restoreReview,
  removeReview,
  closeErrorReport,
  reopenErrorReport,
  approveSuggestion,
  rejectSuggestion,
  approveApplication,
  rejectApplication,
  setComplaintStatus,
  blockSupplierFromComplaint,
} from "@/app/admin/moderation/actions";
import { approvePendingChanges, rejectPendingChanges } from "@/app/admin/suppliers/actions";

function ActionButtons({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function useModerationAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось выполнить действие.");
      }
    });
  }
  return { pending, run, error };
}

export function ReviewModerationActions({ reviewId, status }: { reviewId: string; status: string }) {
  const { pending, run, error } = useModerationAction();
  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-[#b3261e]">{error}</p>}
      <ActionButtons>
        {status !== "published" && (
          <button disabled={pending} onClick={() => run(() => approveReview(reviewId))} className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white">
            Опубликовать
          </button>
        )}
        {status === "published" && (
          <button disabled={pending} onClick={() => run(() => hideReview(reviewId))} className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]">
            Скрыть
          </button>
        )}
        {status === "hidden" && (
          <button disabled={pending} onClick={() => run(() => restoreReview(reviewId))} className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]">
            Восстановить
          </button>
        )}
        {status !== "removed" && (
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("Удалить отзыв за нарушение правил?")) run(() => removeReview(reviewId));
            }}
            className="rounded-full border border-[#b3261e] px-3 py-1 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
          >
            Удалить (нарушение)
          </button>
        )}
      </ActionButtons>
    </div>
  );
}

export function ErrorReportActions({ reportId, status }: { reportId: string; status: string }) {
  const { pending, run, error } = useModerationAction();
  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-[#b3261e]">{error}</p>}
      <ActionButtons>
        {status === "open" ? (
          <button disabled={pending} onClick={() => run(() => closeErrorReport(reportId))} className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white">
            Отметить решённым
          </button>
        ) : (
          <button disabled={pending} onClick={() => run(() => reopenErrorReport(reportId))} className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]">
            Открыть снова
          </button>
        )}
      </ActionButtons>
    </div>
  );
}

export function SuggestionActions({ suggestionId }: { suggestionId: string }) {
  const { pending, run, error } = useModerationAction();
  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-[#b3261e]">{error}</p>}
      <ActionButtons>
        <button disabled={pending} onClick={() => run(() => approveSuggestion(suggestionId))} className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white">
          Принять к добавлению
        </button>
        <button
          disabled={pending}
          onClick={() => {
            const note = prompt("Причина отклонения (необязательно):") ?? "";
            run(() => rejectSuggestion(suggestionId, note));
          }}
          className="rounded-full border border-[#b3261e] px-3 py-1 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
        >
          Отклонить
        </button>
      </ActionButtons>
    </div>
  );
}

export function ComplaintActions({
  complaintId,
  supplierEntityId,
}: {
  complaintId: string;
  supplierEntityId?: string;
}) {
  const { pending, run, error } = useModerationAction();
  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-[#b3261e]">{error}</p>}
      <ActionButtons>
        <button disabled={pending} onClick={() => run(() => setComplaintStatus(complaintId, "in_review"))} className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]">
          В работу
        </button>
        <button
          disabled={pending}
          onClick={() => {
            const note = prompt("Комментарий (необязательно):") ?? "";
            run(() => setComplaintStatus(complaintId, "resolved", note));
          }}
          className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white"
        >
          Решено
        </button>
        <button disabled={pending} onClick={() => run(() => setComplaintStatus(complaintId, "closed"))} className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]">
          Закрыть
        </button>
        {supplierEntityId && (
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("Заблокировать поставщика на основании этой жалобы?")) run(() => blockSupplierFromComplaint(complaintId, supplierEntityId));
            }}
            className="rounded-full border border-[#b3261e] px-3 py-1 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
          >
            Заблокировать поставщика
          </button>
        )}
      </ActionButtons>
    </div>
  );
}

export function ProfileChangeActions({ supplierId }: { supplierId: string }) {
  const { pending, run, error } = useModerationAction();
  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-[#b3261e]">{error}</p>}
      <ActionButtons>
        <button disabled={pending} onClick={() => run(() => approvePendingChanges(supplierId))} className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white">
          Одобрить изменения
        </button>
        <button
          disabled={pending}
          onClick={() => {
            const note = prompt("Причина отклонения (необязательно):") ?? "";
            run(() => rejectPendingChanges(supplierId, note));
          }}
          className="rounded-full border border-[#b3261e] px-3 py-1 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
        >
          Отклонить
        </button>
      </ActionButtons>
    </div>
  );
}

export function ApplicationActions({ applicationId }: { applicationId: string }) {
  const { pending, run, error } = useModerationAction();
  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-[#b3261e]">{error}</p>}
      <ActionButtons>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm("Одобрить заявку и создать карточку поставщика?")) run(() => approveApplication(applicationId));
          }}
          className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white"
        >
          Одобрить и опубликовать
        </button>
        <button
          disabled={pending}
          onClick={() => {
            const note = prompt("Причина отклонения (необязательно):") ?? "";
            run(() => rejectApplication(applicationId, note));
          }}
          className="rounded-full border border-[#b3261e] px-3 py-1 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
        >
          Отклонить
        </button>
      </ActionButtons>
    </div>
  );
}
