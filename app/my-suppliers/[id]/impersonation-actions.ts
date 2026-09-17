"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function exitImpersonation(supplierId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("audit_log").insert({
      actor_user_id: user.id,
      actor_role: "platform_admin",
      entity_type: "supplier",
      entity_id: supplierId,
      action: "impersonation_ended",
      old_value: null,
      new_value: null,
    });
  }
}
