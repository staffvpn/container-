"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  return { supabase, userId: user.id };
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actorUserId: string,
  supplierId: string,
  action: string,
  oldValue: unknown,
  newValue: unknown,
) {
  await supabase.from("audit_log").insert({
    actor_user_id: actorUserId,
    actor_role: "user",
    entity_type: "ownership_invitation",
    entity_id: supplierId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}

export async function acceptInvitation(invitationId: string) {
  const { supabase, userId } = await requireUser();

  const { data: invitation } = await supabase
    .from("ownership_invitations")
    .select("id, supplier_id, invited_user_id, role_offered, status, expires_at, invited_by")
    .eq("id", invitationId)
    .single();

  if (!invitation) throw new Error("Приглашение не найдено.");
  if (invitation.invited_user_id !== userId) throw new Error("Это приглашение адресовано другому пользователю.");
  if (invitation.status !== "pending") throw new Error("Это приглашение уже обработано.");
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from("ownership_invitations").update({ status: "expired" }).eq("id", invitationId);
    throw new Error("Срок действия приглашения истёк.");
  }

  if (invitation.role_offered === "owner") {
    const { data: existingOwner } = await supabase
      .from("supplier_members")
      .select("id")
      .eq("supplier_id", invitation.supplier_id)
      .eq("role", "owner")
      .maybeSingle();
    if (existingOwner) {
      throw new Error("У этого поставщика уже назначен владелец. Обратитесь к администратору платформы.");
    }
  }

  const { error: memberError } = await supabase.from("supplier_members").upsert(
    {
      supplier_id: invitation.supplier_id,
      user_id: userId,
      role: invitation.role_offered,
      invited_by: invitation.invited_by,
    },
    { onConflict: "supplier_id,user_id" },
  );
  if (memberError) throw new Error(memberError.message);

  if (invitation.role_offered === "owner") {
    await supabase.from("suppliers").update({ owner_user_id: userId }).eq("id", invitation.supplier_id);
  }

  const { error } = await supabase
    .from("ownership_invitations")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", invitationId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, invitation.supplier_id, "invitation_accepted", null, { role: invitation.role_offered });
  revalidatePath("/invitations");
}

export async function declineInvitation(invitationId: string) {
  const { supabase, userId } = await requireUser();

  const { data: invitation } = await supabase
    .from("ownership_invitations")
    .select("id, supplier_id, invited_user_id, status")
    .eq("id", invitationId)
    .single();
  if (!invitation) throw new Error("Приглашение не найдено.");
  if (invitation.invited_user_id !== userId) throw new Error("Это приглашение адресовано другому пользователю.");
  if (invitation.status !== "pending") throw new Error("Это приглашение уже обработано.");

  const { error } = await supabase
    .from("ownership_invitations")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", invitationId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, invitation.supplier_id, "invitation_declined", null, null);
  revalidatePath("/invitations");
}
