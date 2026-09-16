import { createServerSupabaseClient } from "@/lib/supabase/server";

type CompanyRole = "viewer" | "editor" | "admin" | "owner";
const roleRank: Record<CompanyRole, number> = { viewer: 0, editor: 1, admin: 2, owner: 3 };

export type SupplierAccess = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  userId: string;
  actingAs: "platform_admin" | CompanyRole;
  isImpersonating: boolean;
};

export async function requireSupplierAccess(supplierId: string, minRole: CompanyRole): Promise<SupplierAccess> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Войдите, чтобы продолжить.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "admin") {
    const { data: member } = await supabase
      .from("supplier_members")
      .select("role")
      .eq("supplier_id", supplierId)
      .eq("user_id", user.id)
      .maybeSingle();
    return { supabase, userId: user.id, actingAs: "platform_admin", isImpersonating: !member };
  }

  const { data: member } = await supabase
    .from("supplier_members")
    .select("role")
    .eq("supplier_id", supplierId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || roleRank[member.role as CompanyRole] < roleRank[minRole]) {
    throw new Error("У вас недостаточно прав для этого действия.");
  }

  return { supabase, userId: user.id, actingAs: member.role as CompanyRole, isImpersonating: false };
}

export async function logAudit(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actorUserId: string,
  actorRole: string,
  entityType: string,
  entityId: string,
  action: string,
  oldValue: unknown,
  newValue: unknown,
) {
  await supabase.from("audit_log").insert({
    actor_user_id: actorUserId,
    actor_role: actorRole,
    entity_type: entityType,
    entity_id: entityId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}
