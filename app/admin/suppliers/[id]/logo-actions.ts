"use server";

import { revalidatePath } from "next/cache";
import { requireSupplierAccess, logAudit } from "@/lib/admin/supplier-access";

export type LogoUploadState = { error?: string; url?: string };

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const maxBytes = 5 * 1024 * 1024;

export async function uploadSupplierLogo(
  supplierId: string,
  _prev: LogoUploadState,
  formData: FormData,
): Promise<LogoUploadState> {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "editor");

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите файл изображения." };
  }
  if (!allowedTypes.has(file.type)) {
    return { error: "Поддерживаются только PNG, JPEG, WEBP и GIF." };
  }
  if (file.size > maxBytes) {
    return { error: "Файл слишком большой (максимум 5 МБ)." };
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${supplierId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("supplier-logos")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) {
    return { error: `Не удалось загрузить файл: ${uploadError.message}` };
  }

  const { data: publicUrlData } = supabase.storage.from("supplier-logos").getPublicUrl(path);
  const url = publicUrlData.publicUrl;

  const { data: existing } = await supabase.from("suppliers").select("logo_url").eq("id", supplierId).single();

  const { error: updateError } = await supabase
    .from("suppliers")
    .update({ logo_url: url, updated_at: new Date().toISOString() })
    .eq("id", supplierId);
  if (updateError) {
    return { error: `Файл загружен, но не удалось сохранить ссылку: ${updateError.message}` };
  }

  await logAudit(supabase, userId, actingAs, "supplier", supplierId, "logo_uploaded", { logo_url: existing?.logo_url }, { logo_url: url });

  revalidatePath(`/admin/suppliers/${supplierId}`);
  revalidatePath(`/my-suppliers/${supplierId}`);
  return { url };
}
