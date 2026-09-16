import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatAuditValues } from "@/lib/admin/audit-format";

const actionLabels: Record<string, string> = {
  created: "Создание",
  updated: "Изменение",
  status_changed: "Смена статуса",
  soft_deleted: "Удаление (в архив)",
  restored: "Восстановление",
  hard_deleted: "Безвозвратное удаление",
  address_added: "Добавление адреса",
  address_deleted: "Удаление адреса",
  address_set_primary: "Смена основного адреса",
  address_coordinates_set: "Ручные координаты",
  submitted: "Отправка заявки",
  owner_assigned: "Назначение владельца",
  ownership_transferred: "Передача владения",
  role_changed: "Смена роли",
  claim_approved: "Заявка одобрена",
  claim_rejected: "Заявка отклонена",
  admin_promoted: "Назначен администратором",
  admin_demoted: "Снят с администратора",
  admin_permissions_changed: "Изменены права администратора",
};

const entityLabels: Record<string, string> = {
  supplier: "Поставщик",
  supplier_address: "Адрес поставщика",
  supplier_application: "Заявка на регистрацию",
  supplier_suggestion: "Заявка «Добавить поставщика»",
  review: "Отзыв",
  error_report: "Сообщение об ошибке",
  ownership_invitation: "Приглашение к владению",
  ownership_claim: "Заявка «Это моя компания»",
  admin: "Администратор",
};

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string): string {
  const v = params[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const entityType = readParam(params, "entity");

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("audit_log")
    .select("id, actor_user_id, actor_role, entity_type, entity_id, action, old_value, new_value, note, created_at, profiles(display_name, telegram_username)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (entityType) query = query.eq("entity_type", entityType);

  const { data: entries, error } = await query;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Журнал действий</h1>

      <form className="flex flex-wrap items-center gap-2" method="get">
        <select
          name="entity"
          defaultValue={entityType}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
        >
          <option value="">Все сущности</option>
          {Object.entries(entityLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm hover:border-[var(--color-ink)]"
        >
          Применить
        </button>
      </form>

      {error && <p className="text-sm text-[#b3261e]">Ошибка загрузки: {error.message}</p>}

      <div className="flex flex-col gap-2">
        {(entries ?? []).map((entry) => (
          <div key={entry.id} className="rounded-[var(--radius-sm)] border border-[var(--color-line)] p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>
                <span className="font-medium">
                  {entry.profiles?.display_name || entry.profiles?.telegram_username || "Система"}
                </span>
                {" — "}
                <span>{actionLabels[entry.action] ?? entry.action}</span>
                {" · "}
                <span className="text-[var(--color-ink-soft)]">
                  {entityLabels[entry.entity_type] ?? entry.entity_type}
                </span>
              </p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {new Date(entry.created_at).toLocaleString("ru-RU")}
              </p>
            </div>
            {entry.note && <p className="mt-1 text-[var(--color-ink-soft)]">{entry.note}</p>}
            {(() => {
              const fields = formatAuditValues(entry.old_value, entry.new_value);
              if (fields.length === 0) return null;
              return (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-[var(--color-ink-soft)]">Подробности</summary>
                  <dl className="mt-2 flex flex-col gap-1 rounded-[var(--radius-sm)] bg-[var(--color-panel)] p-3 text-sm">
                    {fields.map((f, i) => (
                      <div key={i} className="flex flex-wrap gap-1">
                        <dt className="text-[var(--color-ink-soft)]">{f.label}:</dt>
                        <dd>
                          {f.oldText !== undefined ? (
                            <>
                              <span className="text-[var(--color-ink-soft)] line-through">{f.oldText}</span>
                              {" → "}
                              <span className="font-medium">{f.newText}</span>
                            </>
                          ) : (
                            f.newText
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              );
            })()}
          </div>
        ))}
        {(entries ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-[var(--color-ink-soft)]">Записей пока нет.</p>
        )}
      </div>
    </div>
  );
}
