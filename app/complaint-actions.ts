"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function submitComplaint(
  entityType: "supplier" | "offer" | "review",
  entityId: string,
  reason: string,
  description: string,
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Войдите, чтобы отправить жалобу.");

  const { error } = await supabase.from("complaints").insert({
    entity_type: entityType,
    entity_id: entityId,
    user_id: user.id,
    reason,
    description: description || null,
  });
  if (error) throw new Error(error.message);
}
