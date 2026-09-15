import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TelegramLoginButton } from "@/components/telegram-login-button";
import { LogoutButton } from "@/components/logout-button";

export const metadata: Metadata = {
  title: "Профиль — Грядка",
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
        <TelegramLoginButton botId="8765193467" />
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

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
      <LogoutButton />
    </main>
  );
}
