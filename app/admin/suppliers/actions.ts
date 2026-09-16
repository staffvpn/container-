"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireSupplierAccess, logAudit as logSupplierAudit } from "@/lib/admin/supplier-access";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") throw new Error("not an admin");

  return { supabase, userId: user.id };
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actorUserId: string,
  actorRole: string,
  entityId: string,
  action: string,
  oldValue: unknown,
  newValue: unknown,
) {
  await logSupplierAudit(supabase, actorUserId, actorRole, "supplier", entityId, action, oldValue, newValue);
}

const translitMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(input: string): string {
  const transliterated = input
    .toLowerCase()
    .split("")
    .map((ch) => translitMap[ch] ?? ch)
    .join("");
  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "supplier";
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  base: string,
  excludeId?: string,
): Promise<string> {
  let slug = slugify(base);
  let suffix = 1;
  for (;;) {
    let query = supabase.from("suppliers").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    suffix += 1;
    slug = `${slugify(base)}-${suffix}`;
  }
}

export type SupplierFormState = { error?: string };

function parseCommon(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    short_description: String(formData.get("short_description") ?? "").trim(),
    about: String(formData.get("about") ?? "").trim(),
    founded_year: formData.get("founded_year") ? Number(formData.get("founded_year")) : null,
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    city_id: String(formData.get("city_id") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    verification_level: String(formData.get("verification_level") ?? "none"),
    website_url: String(formData.get("website_url") ?? "").trim() || null,
    telegram: String(formData.get("telegram") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    contact_notes: String(formData.get("contact_notes") ?? "").trim() || null,
    terms_notes: String(formData.get("terms_notes") ?? "").trim() || null,
    admin_notes: String(formData.get("admin_notes") ?? "").trim() || null,
    min_order: formData.get("min_order") ? Number(formData.get("min_order")) : null,
    delivery_available: formData.get("delivery_available") === "on",
    pickup_available: formData.get("pickup_available") === "on",
    works_with_legal_entities: formData.get("works_with_legal_entities") === "on",
    works_with_individual_entrepreneurs: formData.get("works_with_individual_entrepreneurs") === "on",
    deferred_payment: formData.get("deferred_payment") === "on",
    payment_methods: formData.getAll("payment_methods").map(String),
    category_ids: formData.getAll("category_ids").map(String),
    service_city_ids: formData.getAll("service_city_ids").map(String),
  };
}

export async function createSupplier(_prev: SupplierFormState, formData: FormData): Promise<SupplierFormState> {
  const { supabase, userId } = await requireAdmin();
  const fields = parseCommon(formData);

  if (!fields.name || !fields.short_description || !fields.about || !fields.city_id) {
    return { error: "Заполните название, краткое описание, описание и город." };
  }

  const slug = await uniqueSlug(supabase, fields.name);

  const { data: inserted, error } = await supabase
    .from("suppliers")
    .insert({
      slug,
      name: fields.name,
      short_description: fields.short_description,
      about: fields.about,
      founded_year: fields.founded_year,
      logo_url: fields.logo_url,
      city_id: fields.city_id,
      status: fields.status,
      verification_level: fields.verification_level,
      website_url: fields.website_url,
      telegram: fields.telegram,
      phone: fields.phone,
      email: fields.email,
      contact_notes: fields.contact_notes,
      terms_notes: fields.terms_notes,
      admin_notes: fields.admin_notes,
      min_order: fields.min_order,
      delivery_available: fields.delivery_available,
      pickup_available: fields.pickup_available,
      works_with_legal_entities: fields.works_with_legal_entities,
      works_with_individual_entrepreneurs: fields.works_with_individual_entrepreneurs,
      deferred_payment: fields.deferred_payment,
      payment_methods: fields.payment_methods,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: `Не удалось создать поставщика: ${error?.message ?? "неизвестная ошибка"}` };
  }

  if (fields.category_ids.length > 0) {
    await supabase
      .from("supplier_categories")
      .insert(fields.category_ids.map((category_id) => ({ supplier_id: inserted.id, category_id })));
  }
  if (fields.service_city_ids.length > 0) {
    await supabase
      .from("supplier_service_cities")
      .insert(fields.service_city_ids.map((city_id) => ({ supplier_id: inserted.id, city_id })));
  }

  await logAudit(supabase, userId, "admin", inserted.id, "created", null, fields);

  revalidatePath("/admin/suppliers");
  redirect(`/admin/suppliers/${inserted.id}`);
}

export async function updateSupplier(
  supplierId: string,
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "editor");
  const fields = parseCommon(formData);

  if (!fields.name || !fields.short_description || !fields.about || !fields.city_id) {
    return { error: "Заполните название, краткое описание, описание и город." };
  }

  const { data: existing } = await supabase.from("suppliers").select("*").eq("id", supplierId).single();

  // Editors (content-level role) may not change publication status, verification, or internal admin notes.
  const canManageStatus = actingAs === "platform_admin" || actingAs === "owner" || actingAs === "admin";

  const { error } = await supabase
    .from("suppliers")
    .update({
      name: fields.name,
      short_description: fields.short_description,
      about: fields.about,
      founded_year: fields.founded_year,
      logo_url: fields.logo_url,
      city_id: fields.city_id,
      ...(canManageStatus ? { status: fields.status, verification_level: fields.verification_level, admin_notes: fields.admin_notes } : {}),
      website_url: fields.website_url,
      telegram: fields.telegram,
      phone: fields.phone,
      email: fields.email,
      contact_notes: fields.contact_notes,
      terms_notes: fields.terms_notes,
      min_order: fields.min_order,
      delivery_available: fields.delivery_available,
      pickup_available: fields.pickup_available,
      works_with_legal_entities: fields.works_with_legal_entities,
      works_with_individual_entrepreneurs: fields.works_with_individual_entrepreneurs,
      deferred_payment: fields.deferred_payment,
      payment_methods: fields.payment_methods,
      updated_at: new Date().toISOString(),
    })
    .eq("id", supplierId);

  if (error) {
    return { error: `Не удалось сохранить: ${error.message}` };
  }

  await supabase.from("supplier_categories").delete().eq("supplier_id", supplierId);
  if (fields.category_ids.length > 0) {
    await supabase
      .from("supplier_categories")
      .insert(fields.category_ids.map((category_id) => ({ supplier_id: supplierId, category_id })));
  }

  await supabase.from("supplier_service_cities").delete().eq("supplier_id", supplierId);
  if (fields.service_city_ids.length > 0) {
    await supabase
      .from("supplier_service_cities")
      .insert(fields.service_city_ids.map((city_id) => ({ supplier_id: supplierId, city_id })));
  }

  await logAudit(supabase, userId, actingAs, supplierId, "updated", existing, fields);

  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${supplierId}`);
  revalidatePath(`/my-suppliers/${supplierId}`);
  return {};
}

export async function setSupplierStatus(supplierId: string, status: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "admin");
  const { data: existing } = await supabase.from("suppliers").select("status").eq("id", supplierId).single();

  const { error } = await supabase
    .from("suppliers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", supplierId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, actingAs, supplierId, "status_changed", { status: existing?.status }, { status });
  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${supplierId}`);
  revalidatePath(`/my-suppliers/${supplierId}`);
}

export async function softDeleteSupplier(supplierId: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "owner");
  const { error } = await supabase
    .from("suppliers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", supplierId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, actingAs, supplierId, "soft_deleted", null, null);
  revalidatePath("/admin/suppliers");
}

export async function restoreSupplier(supplierId: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "owner");
  const { error } = await supabase.from("suppliers").update({ deleted_at: null }).eq("id", supplierId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, actingAs, supplierId, "restored", null, null);
  revalidatePath("/admin/suppliers");
}

export async function hardDeleteSupplier(supplierId: string) {
  const { supabase, userId, actingAs } = await requireSupplierAccess(supplierId, "owner");
  const { data: existing } = await supabase.from("suppliers").select("*").eq("id", supplierId).single();

  const { error } = await supabase.from("suppliers").delete().eq("id", supplierId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, actingAs, supplierId, "hard_deleted", existing, null);
  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}
