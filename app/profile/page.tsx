import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TelegramLoginButton } from "@/components/telegram-login-button";
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
          Войдите через Telegram, чтобы оставлять отзывы, добавлять поставщиков и следить за
          своими заявками.
        </p>
        <TelegramLoginButton botId="8866261929" />
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
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

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      {profile?.avatar_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt=""
          width={72}
          height={72}
          className="rounded-full"
        />
      )}
      <h1 className="text-2xl font-semibold">{profile?.display_name || "Профиль"}</h1>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!!pendingInvitations && pendingInvitations > 0 && (
          <a
            href="/invitations"
            className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Приглашения ({pendingInvitations})
          </a>
        )}
        {!!myCompanies && myCompanies > 0 && (
          <a
            href="/my-suppliers"
            className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm hover:border-[var(--color-ink)]"
          >
            Мои компании
          </a>
        )}
      </div>
      <LogoutButton />
    </main>
  );
}
