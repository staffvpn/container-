import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { InvitationActions } from "@/components/invitation-actions";

export const metadata: Metadata = {
  title: "Приглашения",
};

const roleLabels: Record<string, string> = {
  owner: "Владелец",
  admin: "Администратор компании",
  editor: "Редактор",
  viewer: "Только просмотр",
};

export default async function InvitationsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/profile");

  await supabase
    .from("ownership_invitations")
    .update({ status: "expired" })
    .eq("invited_user_id", user.id)
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());

  const { data: invitations } = await supabase
    .from("ownership_invitations")
    .select("id, role_offered, created_at, suppliers(name, slug)")
    .eq("invited_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Приглашения</h1>
      {(invitations ?? []).length === 0 && (
        <p className="text-sm text-[var(--color-ink-soft)]">У вас нет приглашений в ожидании ответа.</p>
      )}
      <div className="flex flex-col gap-3">
        {(invitations ?? []).map((inv) => (
          <div key={inv.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
            <p className="font-medium">{inv.suppliers?.name}</p>
            <p className="text-sm text-[var(--color-ink-soft)]">
              Вам предложена роль: {roleLabels[inv.role_offered] ?? inv.role_offered}
            </p>
            <div className="mt-3">
              <InvitationActions invitationId={inv.id} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
