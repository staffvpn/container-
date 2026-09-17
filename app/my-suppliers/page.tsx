import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Мои компании",
};

const roleLabels: Record<string, string> = {
  owner: "Владелец",
  admin: "Администратор компании",
  editor: "Редактор",
  viewer: "Только просмотр",
};

export default async function MySuppliersPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/profile");

  const { data: memberships } = await supabase
    .from("supplier_members")
    .select("role, suppliers(id, name, status)")
    .eq("user_id", user.id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Мои компании</h1>
      {(memberships ?? []).length === 0 && (
        <p className="text-sm text-[var(--color-ink-soft)]">
          Вы пока не привязаны ни к одному поставщику. Если это ваша компания, найдите её карточку и нажмите «Это моя
          компания», либо дождитесь приглашения от администратора.
        </p>
      )}
      <div className="flex flex-col gap-3">
        {(memberships ?? []).map((m) => (
          <Link
            key={m.suppliers?.id}
            href={`/my-suppliers/${m.suppliers?.id}`}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-line)] p-4 hover:border-[var(--color-ink)]"
          >
            <p className="font-medium">{m.suppliers?.name}</p>
            <span className="rounded-full bg-[var(--color-panel)] px-2.5 py-0.5 text-xs">{roleLabels[m.role] ?? m.role}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
