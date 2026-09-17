import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminPermissionsForm } from "@/components/admin/admin-permissions-form";
import { promoteToAdmin } from "@/app/admin/admins/actions";
import type { PermissionKey } from "@/lib/admin/permissions";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string): string {
  const v = params[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = readParam(params, "q");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: admins } = await supabase
    .from("profiles")
    .select("id, display_name, telegram_username, created_at")
    .eq("role", "admin")
    .order("created_at");

  const adminIds = (admins ?? []).map((a) => a.id);
  const { data: permissionRows } = adminIds.length
    ? await supabase.from("admin_permissions").select("user_id, permissions").in("user_id", adminIds)
    : { data: [] };

  const permissionsByUser = new Map((permissionRows ?? []).map((r) => [r.user_id, r.permissions as PermissionKey[]]));

  let searchResults: { id: string; display_name: string | null; telegram_username: string | null }[] = [];
  if (q) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, telegram_username")
      .neq("role", "admin")
      .or(`display_name.ilike.%${q}%,telegram_username.ilike.%${q}%`)
      .limit(10);
    searchResults = data ?? [];
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Администраторы и права</h1>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Текущие администраторы</h2>
        {(admins ?? []).map((admin) => (
          <div key={admin.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">
                {admin.display_name || admin.telegram_username || admin.id}
                {admin.id === currentUser?.id && (
                  <span className="ml-2 rounded-full bg-[var(--color-panel)] px-2 py-0.5 text-xs">Это вы</span>
                )}
              </p>
              <Link
                href={`/admin/audit?actor=${admin.id}`}
                className="text-sm text-[var(--color-accent)] underline"
              >
                История действий
              </Link>
            </div>
            <div className="mt-3">
              <AdminPermissionsForm
                userId={admin.id}
                currentPermissions={permissionsByUser.get(admin.id) ?? null}
                isSelf={admin.id === currentUser?.id}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Назначить администратора</h2>
        <form className="flex gap-2" method="get">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Поиск по имени или Telegram..."
            className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm hover:border-[var(--color-ink)]"
          >
            Найти
          </button>
        </form>

        {q && searchResults.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">Пользователи не найдены.</p>
        )}

        {searchResults.map((result) => (
          <div key={result.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-line)] p-3">
            <p>{result.display_name || result.telegram_username || result.id}</p>
            <form action={promoteToAdmin.bind(null, result.id)}>
              <button
                type="submit"
                className="rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-xs font-medium text-white"
              >
                Назначить администратором
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
