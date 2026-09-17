import Link from "next/link";
import { one } from "@/lib/data/one";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminSupplierActions } from "@/components/admin/supplier-actions";

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  pending: "На проверке",
  published: "Опубликован",
  hidden: "Скрыт",
  rejected: "Отклонён",
  blocked: "Заблокирован",
  archived: "В архиве",
};

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string): string {
  const v = params[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function AdminSuppliersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const statusFilter = readParam(params, "status");
  const showDeleted = readParam(params, "deleted") === "1";

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("suppliers")
    .select("id, slug, name, status, verification_level, rating, review_count, created_at, updated_at, deleted_at, cities!city_id(name)")
    .order("created_at", { ascending: false });

  if (showDeleted) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }
  if (statusFilter) query = query.eq("status", statusFilter);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: suppliers, error } = await query;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Поставщики</h1>
        <Link
          href="/admin/suppliers/new"
          className="rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + Новый поставщик
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-2" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Поиск по названию..."
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
        >
          <option value="">Все статусы</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="deleted" value="1" defaultChecked={showDeleted} />
          Показать удалённые
        </label>
        <button
          type="submit"
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm hover:border-[var(--color-ink)]"
        >
          Применить
        </button>
      </form>

      {error && <p className="text-sm text-[#b3261e]">Ошибка загрузки: {error.message}</p>}

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-line)]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[var(--color-panel)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Город</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Проверка</th>
              <th className="px-4 py-3">Рейтинг</th>
              <th className="px-4 py-3">Обновлён</th>
              <th className="px-4 py-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {(suppliers ?? []).map((s) => (
              <tr key={s.id} className="border-t border-[var(--color-line)]">
                <td className="px-4 py-3">
                  <Link href={`/admin/suppliers/${s.id}`} className="font-medium hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{one(s.cities)?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[var(--color-panel)] px-2.5 py-1 text-xs">
                    {statusLabels[s.status] ?? s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">{s.verification_level}</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">★ {Number(s.rating).toFixed(1)} ({s.review_count})</td>
                <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                  {new Date(s.updated_at).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-3">
                  <AdminSupplierActions
                    supplierId={s.id}
                    status={s.status}
                    isDeleted={Boolean(s.deleted_at)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(suppliers ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-[var(--color-ink-soft)]">Ничего не найдено.</p>
        )}
      </div>
    </div>
  );
}
