"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ClaimFormState = { error?: string; success?: boolean };

export async function submitOwnershipClaim(
  supplierSlug: string,
  _prev: ClaimFormState,
  formData: FormData,
): Promise<ClaimFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Войдите через Telegram, чтобы отправить заявку." };
  }

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("slug", supplierSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!supplier) {
    return { error: "Поставщик не найден." };
  }

  const position = String(formData.get("position") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const comment = String(formData.get("comment") ?? "").trim() || null;

  const { error } = await supabase.from("ownership_claims").insert({
    supplier_id: supplier.id,
    user_id: user.id,
    position,
    phone,
    email,
    comment,
  });

  if (error) {
    return { error: `Не удалось отправить заявку: ${error.message}` };
  }

  return { success: true };
}
