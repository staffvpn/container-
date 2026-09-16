"use client";

import { useState, useTransition } from "react";
import {
  inviteMember,
  cancelInvitation,
  changeMemberRole,
  removeMember,
  transferOwnership,
} from "@/app/admin/suppliers/[id]/members-actions";

const roleLabels: Record<string, string> = {
  owner: "Владелец",
  admin: "Администратор компании",
  editor: "Редактор",
  viewer: "Только просмотр",
};

type Member = {
  id: string;
  role: string;
  user_id: string;
  display_name: string | null;
  telegram_username: string | null;
};

type Invitation = {
  id: string;
  role_offered: string;
  status: string;
  invited_user_id: string;
  display_name: string | null;
  telegram_username: string | null;
};

type SearchResult = {
  id: string;
  display_name: string | null;
  telegram_username: string | null;
};

export function SupplierMembers({
  supplierId,
  members,
  invitations,
  searchResults,
  searchQuery,
  canAssignOwner = true,
  canTransferOwnership = true,
}: {
  supplierId: string;
  members: Member[];
  invitations: Invitation[];
  searchResults: SearchResult[];
  searchQuery: string;
  canAssignOwner?: boolean;
  canTransferOwnership?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<Record<string, string>>({});
  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const [transferFate, setTransferFate] = useState<"demote" | "remove">("demote");

  const owner = members.find((m) => m.role === "owner");
  const nonOwnerMembers = members.filter((m) => m.role !== "owner");

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
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-[#b3261e]">{error}</p>}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-[var(--color-ink-soft)]">Владелец</h3>
        {owner ? (
          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-line)] p-3">
            <p>{owner.display_name || owner.telegram_username || owner.user_id}</p>
            <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs text-[var(--color-accent)]">
              Владелец
            </span>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-soft)]">Владелец пока не назначен.</p>
        )}
      </div>

      {nonOwnerMembers.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-[var(--color-ink-soft)]">Участники</h3>
          {nonOwnerMembers.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line)] p-3">
              <p>{m.display_name || m.telegram_username || m.user_id}</p>
              <div className="flex items-center gap-2">
                <select
                  defaultValue={m.role}
                  disabled={pending}
                  onChange={(e) => run(() => changeMemberRole(supplierId, m.id, e.target.value))}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-xs"
                >
                  <option value="admin">Администратор компании</option>
                  <option value="editor">Редактор</option>
                  <option value="viewer">Только просмотр</option>
                </select>
                {owner && canTransferOwnership && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setTransferTarget(m.id);
                      setTransferFate("demote");
                    }}
                    className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
                  >
                    Сделать владельцем
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm("Удалить участника из поставщика?")) run(() => removeMember(supplierId, m.id));
                  }}
                  className="rounded-full border border-[#b3261e] px-3 py-1 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {transferTarget && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-accent)] p-4">
          <p className="mb-2 font-medium">Передать владение</p>
          <p className="mb-3 text-sm text-[var(--color-ink-soft)]">
            Текущий владелец: {owner?.display_name || owner?.telegram_username || owner?.user_id}. Новый владелец:{" "}
            {nonOwnerMembers.find((m) => m.id === transferTarget)?.display_name ||
              nonOwnerMembers.find((m) => m.id === transferTarget)?.telegram_username}
            .
          </p>
          <div className="mb-3 flex items-center gap-2 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={transferFate === "demote"}
                onChange={() => setTransferFate("demote")}
              />
              Прежний владелец станет администратором компании
            </label>
          </div>
          <div className="mb-3 flex items-center gap-2 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={transferFate === "remove"}
                onChange={() => setTransferFate("remove")}
              />
              Прежний владелец теряет доступ
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await transferOwnership(supplierId, transferTarget, transferFate);
                  setTransferTarget(null);
                })
              }
              className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
            >
              Подтвердить передачу
            </button>
            <button
              type="button"
              onClick={() => setTransferTarget(null)}
              className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {invitations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-[var(--color-ink-soft)]">Приглашения в ожидании</h3>
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-line)] p-3">
              <p>
                {inv.display_name || inv.telegram_username || inv.invited_user_id} —{" "}
                <span className="text-[var(--color-ink-soft)]">{roleLabels[inv.role_offered]}</span>
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => cancelInvitation(supplierId, inv.id))}
                className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:border-[var(--color-ink)]"
              >
                Отменить
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-[var(--color-ink-soft)]">Назначить владельца или пригласить сотрудника</h3>
        <form className="flex gap-2" method="get">
          <input
            type="text"
            name="memberQuery"
            defaultValue={searchQuery}
            placeholder="Поиск по имени или Telegram..."
            className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm hover:border-[var(--color-ink)]">
            Найти
          </button>
        </form>

        {searchQuery && searchResults.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">Пользователи не найдены.</p>
        )}

        {searchResults.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line)] p-3">
            <p>{r.display_name || r.telegram_username || r.id}</p>
            <div className="flex items-center gap-2">
              <select
                value={inviteRole[r.id] ?? "editor"}
                onChange={(e) => setInviteRole((prev) => ({ ...prev, [r.id]: e.target.value }))}
                className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-xs"
              >
                {canAssignOwner && <option value="owner">Владелец</option>}
                <option value="admin">Администратор компании</option>
                <option value="editor">Редактор</option>
                <option value="viewer">Только просмотр</option>
              </select>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => inviteMember(supplierId, r.id, inviteRole[r.id] ?? "editor"))}
                className="rounded-full bg-[var(--color-ink)] px-3 py-1 text-xs font-medium text-white"
              >
                Пригласить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
