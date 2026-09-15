"use client";

import { useState, useTransition } from "react";
import { approveClaim, rejectClaim, requestMoreInfo } from "@/app/admin/claims/actions";

export function AdminClaimActions({ claimId }: { claimId: string }) {
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState("owner");
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

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-[#b3261e]">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-xs"
        >
          <option value="owner">Владелец</option>
          <option value="admin">Администратор компании</option>
          <option value="editor">Редактор</option>
          <option value="viewer">Только просмотр</option>
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => approveClaim(claimId, role))}
          className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white"
        >
          Одобрить
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const note = prompt("Причина отклонения (необязательно):") ?? "";
            run(() => rejectClaim(claimId, note));
          }}
          className="rounded-full border border-[#b3261e] px-3 py-1 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
        >
          Отклонить
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const note = prompt("Что уточнить у заявителя?") ?? "";
            if (note) run(() => requestMoreInfo(claimId, note));
          }}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
        >
          Запросить уточнения
        </button>
      </div>
    </div>
  );
}
