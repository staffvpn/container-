"use client";

import { useState, useTransition } from "react";
import {
  setAdminPermissions,
  clearAdminPermissions,
  demoteAdmin,
} from "@/app/admin/admins/actions";
import { permissionKeys, type PermissionKey } from "@/lib/admin/permissions";

const permissionLabels: Record<PermissionKey, string> = {
  view_suppliers: "Просмотр поставщиков",
  create_suppliers: "Создание поставщиков",
  edit_suppliers: "Редактирование поставщиков",
  delete_suppliers: "Удаление поставщиков",
  publish_suppliers: "Публикация",
  manage_addresses: "Управление адресами",
  manage_users: "Управление пользователями",
  manage_owners: "Управление владельцами",
  process_claims: "Обработка заявок",
  view_audit: "Просмотр журнала",
  manage_settings: "Управление настройками",
};

export function AdminPermissionsForm({
  userId,
  currentPermissions,
  isSelf,
}: {
  userId: string;
  currentPermissions: PermissionKey[] | null;
  isSelf: boolean;
}) {
  const [selected, setSelected] = useState<Set<PermissionKey>>(new Set(currentPermissions ?? []));
  const [pending, startTransition] = useTransition();
  const isFullAccess = currentPermissions === null;

  function toggle(key: PermissionKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {isFullAccess ? (
        <p className="text-sm text-[var(--color-accent)]">Полный доступ (ограничений нет)</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {permissionKeys.map((key) => (
            <label
              key={key}
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-sm"
            >
              <input type="checkbox" checked={selected.has(key)} onChange={() => toggle(key)} />
              {permissionLabels[key]}
            </label>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isFullAccess ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setAdminPermissions(userId, []))}
            className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs hover:border-[var(--color-ink)]"
          >
            Ограничить права
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => setAdminPermissions(userId, Array.from(selected)))}
              className="rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-xs font-medium text-white"
            >
              Сохранить права
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => clearAdminPermissions(userId))}
              className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs hover:border-[var(--color-ink)]"
            >
              Выдать полный доступ
            </button>
          </>
        )}
        {!isSelf && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm("Снять права администратора с этого пользователя?")) {
                startTransition(() => demoteAdmin(userId));
              }
            }}
            className="rounded-full border border-[#b3261e] px-3 py-1.5 text-xs text-[#b3261e] hover:bg-[#b3261e] hover:text-white"
          >
            Снять права администратора
          </button>
        )}
      </div>
    </div>
  );
}
