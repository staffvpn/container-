"use server";

import { revalidatePath } from "next/cache";
import { requireSupplierAccess, logAudit } from "@/lib/admin/supplier-access";

function revalidateSupplier(supplierId: string) {
  revalidatePath(`/admin/suppliers/${supplierId}`);
  revalidatePath(`/my-suppliers/${supplierId}`);
  revalidatePath("/offers");
}

export type OfferFormState = { error?: string };

export async function createOffer(
  supplierId: string,
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "editor");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const terms = String(formData.get("terms") ?? "").trim() || null;
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const expiresAt = String(formData.get("expires_at") ?? "") || null;
  const status = String(formData.get("status") ?? "published");

  if (!title || !description) {
    return { error: "Заполните название и описание предложения." };
  }

  const { data: offer, error } = await supabase
    .from("offers")
    .insert({ supplier_id: supplierId, title, description, terms, category_id: categoryId, expires_at: expiresAt, status })
    .select("id")
    .single();
  if (error || !offer) {
    return { error: `Не удалось создать предложение: ${error?.message ?? "неизвестная ошибка"}` };
  }

  const promoCode = String(formData.get("promo_code") ?? "").trim();
  if (promoCode) {
    const discountDescription = String(formData.get("promo_discount") ?? "").trim() || null;
    const promoTerms = String(formData.get("promo_terms") ?? "").trim() || null;
    const minOrder = formData.get("promo_min_order") ? Number(formData.get("promo_min_order")) : null;
    const startsAt = String(formData.get("promo_starts_at") ?? "") || null;
    const endsAt = String(formData.get("promo_ends_at") ?? "") || null;
    const maxUses = formData.get("promo_max_uses") ? Number(formData.get("promo_max_uses")) : null;

    const { error: promoError } = await supabase.from("promo_codes").insert({
      offer_id: offer.id,
      code: promoCode,
      discount_description: discountDescription,
      terms: promoTerms,
      min_order: minOrder,
      starts_at: startsAt,
      ends_at: endsAt,
      max_uses: maxUses,
    });
    if (promoError) {
      return { error: `Предложение создано, но не удалось добавить промокод: ${promoError.message}` };
    }
  }

  await logAudit(supabase, userId, actingAs, "offer", offer.id, "offer_created", null, { title, status });
  revalidateSupplier(supplierId);
  return {};
}

export async function updateOfferStatus(supplierId: string, offerId: string, status: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "editor");
  const { error } = await supabase.from("offers").update({ status }).eq("id", offerId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, actingAs, "offer", offerId, "offer_status_changed", null, { status });
  revalidateSupplier(supplierId);
}

export async function deleteOffer(supplierId: string, offerId: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "editor");
  const { error } = await supabase.from("offers").delete().eq("id", offerId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, actingAs, "offer", offerId, "offer_deleted", null, null);
  revalidateSupplier(supplierId);
}
