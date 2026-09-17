import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth-form";
import { LogoutButton } from "@/components/logout-button";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Профиль",
};

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">Профиль</h1>
        <p className="max-w-sm text-[var(--color-ink-soft)]">
          Войдите или зарегистрируйтесь, чтобы оставлять отзывы, добавлять поставщиков и следить за
          своими заявками.
        </p>
        <AuthForm />
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, telegram_username, role")
    .eq("id", user.id)
    .maybeSingle();

  const { count: pendingInvitations } = await supabase
    .from("ownership_invitations")
    .select("id", { count: "exact", head: true })
    .eq("invited_user_id", user.id)
    .eq("status", "pending");

  const { count: myCompanies } = await supabase
    .from("supplier_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isAdmin = profile?.role === "admin";
  const roleLabel = isAdmin ? "Администратор" : "Пользователь";

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-line)] p-8 text-center">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            width={80}
            height={80}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-panel)] text-2xl font-semibold text-[var(--color-ink-soft)]">
            {(profile?.display_name || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{profile?.display_name || "Профиль"}</h1>
          {profile?.telegram_username && (
            <p className="text-sm text-[var(--color-ink-soft)]">@{profile.telegram_username}</p>
          )}
          <span className="mx-auto mt-1 rounded-full bg-[var(--color-panel)] px-3 py-1 text-xs font-medium">
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {!!pendingInvitations && pendingInvitations > 0 && (
          <a
            href="/invitations"
            className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-4 text-sm font-medium text-white hover:opacity-90"
          >
            Приглашения в компании
            <span className="rounded-full bg-white/20 px-2 py-0.5">{pendingInvitations}</span>
          </a>
        )}

        {isAdmin && (
          <a
            href="/admin"
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-line)] px-5 py-4 text-sm font-medium hover:border-[var(--color-ink)]"
          >
            Админ-панель
            <span aria-hidden>→</span>
          </a>
        )}

        {!!myCompanies && myCompanies > 0 ? (
          <a
            href="/my-suppliers"
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-line)] px-5 py-4 text-sm font-medium hover:border-[var(--color-ink)]"
          >
            Мои компании
            <span aria-hidden>→</span>
          </a>
        ) : (
          <a
            href="/suppliers-portal"
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-line)] px-5 py-4 text-sm font-medium hover:border-[var(--color-ink)]"
          >
            Разместить компанию в Грядке
            <span aria-hidden>→</span>
          </a>
        )}
      </div>

      <div className="flex justify-center">
        <LogoutButton />
      </div>
    </main>
  );
}
