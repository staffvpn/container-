"use server";

import { revalidatePath } from "next/cache";
import { requireSupplierAccess, logAudit } from "@/lib/admin/supplier-access";

function revalidateSupplier(supplierId: string) {
  revalidatePath(`/admin/suppliers/${supplierId}`);
  revalidatePath(`/my-suppliers/${supplierId}`);
}

export async function inviteMember(supplierId: string, targetUserId: string, role: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "admin");

  if (!["owner", "admin", "editor", "viewer"].includes(role)) {
    throw new Error("Некорректная роль.");
  }
  if (role === "owner" && actingAs !== "platform_admin") {
    throw new Error("Назначить владельца может только администратор платформы.");
  }

  const { data: existingMember } = await supabase
    .from("supplier_members")
    .select("id, role")
    .eq("supplier_id", supplierId)
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (existingMember) {
    throw new Error("Этот пользователь уже привязан к поставщику. Измените его роль в списке участников.");
  }

  if (role === "owner") {
    const { data: existingOwner } = await supabase
      .from("supplier_members")
      .select("id")
      .eq("supplier_id", supplierId)
      .eq("role", "owner")
      .maybeSingle();
    if (existingOwner) {
      throw new Error(
        "У поставщика уже есть владелец. Чтобы сменить владельца, используйте действие «Передать владение».",
      );
    }
  }

  const { data: existingInvitation } = await supabase
    .from("ownership_invitations")
    .select("id")
    .eq("supplier_id", supplierId)
    .eq("invited_user_id", targetUserId)
    .eq("status", "pending")
    .maybeSingle();
  if (existingInvitation) {
    throw new Error("Этому пользователю уже отправлено приглашение по этому поставщику.");
  }

  const { error } = await supabase.from("ownership_invitations").insert({
    supplier_id: supplierId,
    invited_by: userId,
    invited_user_id: targetUserId,
    role_offered: role,
  });
  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      throw new Error("Этому пользователю уже отправлено приглашение по этому поставщику.");
    }
    throw new Error(error.message);
  }

  await logAudit(supabase, userId, actingAs, "ownership_invitation", supplierId, "invitation_sent", null, {
    invited_user_id: targetUserId,
    role,
  });
  revalidateSupplier(supplierId);
}

export async function cancelInvitation(supplierId: string, invitationId: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "admin");
  const { error } = await supabase
    .from("ownership_invitations")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, actingAs, "ownership_invitation", supplierId, "invitation_cancelled", null, { id: invitationId });
  revalidateSupplier(supplierId);
}

export async function changeMemberRole(supplierId: string, memberId: string, role: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "admin");

  if (!["admin", "editor", "viewer"].includes(role)) {
    throw new Error("Роль владельца можно назначить только через «Передать владение».");
  }

  const { data: member } = await supabase
    .from("supplier_members")
    .select("role, user_id")
    .eq("id", memberId)
    .single();
  if (!member) throw new Error("Участник не найден.");
  if (member.role === "owner") {
    throw new Error("Роль владельца нельзя изменить напрямую — используйте «Передать владение».");
  }

  const { error } = await supabase.from("supplier_members").update({ role }).eq("id", memberId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, actingAs, "supplier_member", supplierId, "member_role_changed", { role: member.role }, { role, user_id: member.user_id });
  revalidateSupplier(supplierId);
}

export async function removeMember(supplierId: string, memberId: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "admin");

  const { data: member } = await supabase
    .from("supplier_members")
    .select("role, user_id")
    .eq("id", memberId)
    .single();
  if (!member) throw new Error("Участник не найден.");
  if (member.role === "owner") {
    throw new Error("Нельзя удалить владельца напрямую — сначала передайте владение другому участнику.");
  }

  const { error } = await supabase.from("supplier_members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, actingAs, "supplier_member", supplierId, "member_removed", { role: member.role, user_id: member.user_id }, null);
  revalidateSupplier(supplierId);
}

export async function transferOwnership(
  supplierId: string,
  toMemberId: string,
  previousOwnerFate: "demote" | "remove",
) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "owner");

  const { data: currentOwner } = await supabase
    .from("supplier_members")
    .select("id, user_id")
    .eq("supplier_id", supplierId)
    .eq("role", "owner")
    .maybeSingle();
  if (!currentOwner) throw new Error("У поставщика пока нет владельца.");

  const { data: target } = await supabase
    .from("supplier_members")
    .select("id, user_id, role")
    .eq("id", toMemberId)
    .eq("supplier_id", supplierId)
    .maybeSingle();
  if (!target) throw new Error("Новый владелец должен уже быть участником поставщика.");
  if (target.user_id === currentOwner.user_id) throw new Error("Этот участник уже владелец.");

  // The one-owner-per-supplier constraint is enforced by a unique partial index, so the
  // previous owner must stop being "owner" before the new owner row can be promoted —
  // promoting first would momentarily create two owner rows and violate the constraint.
  if (previousOwnerFate === "demote") {
    const { error: demoteError } = await supabase.from("supplier_members").update({ role: "admin" }).eq("id", currentOwner.id);
    if (demoteError) throw new Error(demoteError.message);
  } else {
    const { error: removeError } = await supabase.from("supplier_members").delete().eq("id", currentOwner.id);
    if (removeError) throw new Error(removeError.message);
  }

  const { error: promoteError } = await supabase
    .from("supplier_members")
    .update({ role: "owner" })
    .eq("id", target.id);
  if (promoteError) throw new Error(promoteError.message);

  const { error: supplierError } = await supabase
    .from("suppliers")
    .update({ owner_user_id: target.user_id, updated_at: new Date().toISOString() })
    .eq("id", supplierId);
  if (supplierError) throw new Error(supplierError.message);

  await logAudit(
    supabase,
    userId,
    actingAs,
    "supplier",
    supplierId,
    "ownership_transferred",
    { owner_user_id: currentOwner.user_id, previous_owner_fate: previousOwnerFate },
    { owner_user_id: target.user_id },
  );
  revalidateSupplier(supplierId);
}
