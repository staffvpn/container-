"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PermissionKey } from "@/lib/admin/permissions";

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
  targetUserId: string,
  action: string,
  oldValue: unknown,
  newValue: unknown,
) {
  await supabase.from("audit_log").insert({
    actor_user_id: actorUserId,
    actor_role: "admin",
    entity_type: "admin",
    entity_id: targetUserId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}

export async function promoteToAdmin(targetUserId: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", targetUserId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, targetUserId, "admin_promoted", null, null);
  revalidatePath("/admin/admins");
}

export async function demoteAdmin(targetUserId: string) {
  const { supabase, userId } = await requireAdmin();
  if (targetUserId === userId) {
    throw new Error("Нельзя снять права администратора с самого себя.");
  }

  const { error } = await supabase.from("profiles").update({ role: "user" }).eq("id", targetUserId);
  if (error) throw new Error(error.message);

  await supabase.from("admin_permissions").delete().eq("user_id", targetUserId);
  await logAudit(supabase, userId, targetUserId, "admin_demoted", null, null);
  revalidatePath("/admin/admins");
}

export async function setAdminPermissions(targetUserId: string, permissions: PermissionKey[]) {
  const { supabase, userId } = await requireAdmin();
  const { data: existing } = await supabase
    .from("admin_permissions")
    .select("permissions")
    .eq("user_id", targetUserId)
    .maybeSingle();

  const { error } = await supabase
    .from("admin_permissions")
    .upsert({ user_id: targetUserId, permissions, granted_by: userId, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);

  await logAudit(
    supabase,
    userId,
    targetUserId,
    "admin_permissions_changed",
    { permissions: existing?.permissions ?? null },
    { permissions },
  );
  revalidatePath("/admin/admins");
}

export async function clearAdminPermissions(targetUserId: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.from("admin_permissions").delete().eq("user_id", targetUserId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, targetUserId, "admin_permissions_changed", null, { permissions: "full_access" });
  revalidatePath("/admin/admins");
}
