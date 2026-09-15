"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("not an admin");

  return { supabase, userId: user.id };
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actorUserId: string,
  claimId: string,
  action: string,
  oldValue: unknown,
  newValue: unknown,
) {
  await supabase.from("audit_log").insert({
    actor_user_id: actorUserId,
    actor_role: "admin",
    entity_type: "ownership_claim",
    entity_id: claimId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}

export async function approveClaim(claimId: string, role: string) {
  const { supabase, userId } = await requireAdmin();

  const { data: claim } = await supabase
    .from("ownership_claims")
    .select("supplier_id, user_id, status")
    .eq("id", claimId)
    .single();
  if (!claim) throw new Error("Заявка не найдена.");
  if (claim.status === "approved") throw new Error("Заявка уже одобрена.");

  if (role === "owner") {
    const { data: existingOwner } = await supabase
      .from("supplier_members")
      .select("id")
      .eq("supplier_id", claim.supplier_id)
      .eq("role", "owner")
      .maybeSingle();
    if (existingOwner) {
      throw new Error(
        "У поставщика уже есть владелец. Чтобы передать владение, используйте отдельное действие «Передать владение», а не одобрение заявки.",
      );
    }
  }

  const { error: memberError } = await supabase
    .from("supplier_members")
    .upsert(
      { supplier_id: claim.supplier_id, user_id: claim.user_id, role, invited_by: userId },
      { onConflict: "supplier_id,user_id" },
    );
  if (memberError) throw new Error(memberError.message);

  if (role === "owner") {
    await supabase.from("suppliers").update({ owner_user_id: claim.user_id }).eq("id", claim.supplier_id);
  }

  const { error } = await supabase
    .from("ownership_claims")
    .update({ status: "approved", role_granted: role, reviewed_by: userId, updated_at: new Date().toISOString() })
    .eq("id", claimId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, claimId, "claim_approved", { status: claim.status }, { role });
  revalidatePath("/admin/claims");
}

export async function rejectClaim(claimId: string, note: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("ownership_claims")
    .update({ status: "rejected", reviewer_note: note || null, reviewed_by: userId, updated_at: new Date().toISOString() })
    .eq("id", claimId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, claimId, "claim_rejected", null, { note });
  revalidatePath("/admin/claims");
}

export async function requestMoreInfo(claimId: string, note: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("ownership_claims")
    .update({ status: "more_info_requested", reviewer_note: note || null, updated_at: new Date().toISOString() })
    .eq("id", claimId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, claimId, "claim_more_info_requested", null, { note });
  revalidatePath("/admin/claims");
}
