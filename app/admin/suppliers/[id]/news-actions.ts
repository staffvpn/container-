"use server";

import { revalidatePath } from "next/cache";
import { requireSupplierAccess, logAudit } from "@/lib/admin/supplier-access";

function revalidateSupplier(supplierId: string) {
  revalidatePath(`/admin/suppliers/${supplierId}`);
  revalidatePath(`/my-suppliers/${supplierId}`);
  revalidatePath(`/supplier`);
}

export type NewsFormState = { error?: string };

export async function createNews(
  supplierId: string,
  _prev: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "editor");

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const status = String(formData.get("status") ?? "published");

  if (!title || !content) {
    return { error: "Заполните заголовок и текст новости." };
  }

  const { data: inserted, error } = await supabase
    .from("news")
    .insert({ supplier_id: supplierId, title, content, status, created_by: userId })
    .select("id")
    .single();
  if (error || !inserted) {
    return { error: `Не удалось создать новость: ${error?.message ?? "неизвестная ошибка"}` };
  }

  await logAudit(supabase, userId, actingAs, "news", inserted.id, "news_created", null, { title, status });
  revalidateSupplier(supplierId);
  return {};
}

export async function updateNewsStatus(supplierId: string, newsId: string, status: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "editor");
  const { error } = await supabase
    .from("news")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", newsId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, actingAs, "news", newsId, "news_status_changed", null, { status });
  revalidateSupplier(supplierId);
}

export async function deleteNews(supplierId: string, newsId: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "editor");
  const { error } = await supabase.from("news").delete().eq("id", newsId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, actingAs, "news", newsId, "news_deleted", null, null);
  revalidateSupplier(supplierId);
}
