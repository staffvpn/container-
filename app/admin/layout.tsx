import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-2xl font-semibold">Доступ запрещён</h1>
        <p className="text-[var(--color-ink-soft)]">Этот раздел доступен только администраторам.</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-73px)]">
      <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-[var(--color-line)] p-4">
        <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
          Админка
        </p>
        <Link
          href="/admin/suppliers"
          className="rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-[var(--color-panel)]"
        >
          Поставщики
        </Link>
        <Link
          href="/admin/moderation"
          className="rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-[var(--color-panel)]"
        >
          Модерация
        </Link>
        <Link
          href="/admin/claims"
          className="rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-[var(--color-panel)]"
        >
          Заявки на владение
        </Link>
        <Link
          href="/admin/audit"
          className="rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-[var(--color-panel)]"
        >
          Журнал действий
        </Link>
        <Link
          href="/admin/admins"
          className="rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-[var(--color-panel)]"
        >
          Администраторы
        </Link>
      </aside>
      <div className="flex-1 overflow-x-auto p-6">{children}</div>
    </div>
  );
}
