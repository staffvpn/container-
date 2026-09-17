"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  entityType: string,
  entityId: string,
  action: string,
  oldValue: unknown,
  newValue: unknown,
) {
  await supabase.from("audit_log").insert({
    actor_user_id: actorUserId,
    actor_role: "admin",
    entity_type: entityType,
    entity_id: entityId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}

function revalidateModeration() {
  revalidatePath("/admin/moderation");
}

// --- Reviews ---

export async function approveReview(reviewId: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.from("reviews").update({ status: "published" }).eq("id", reviewId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, "review", reviewId, "review_approved", null, null);
  revalidateModeration();
}

export async function hideReview(reviewId: string, note?: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.from("reviews").update({ status: "hidden" }).eq("id", reviewId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, "review", reviewId, "review_hidden", null, { note });
  revalidateModeration();
}

export async function restoreReview(reviewId: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.from("reviews").update({ status: "published" }).eq("id", reviewId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, "review", reviewId, "review_restored", null, null);
  revalidateModeration();
}

export async function removeReview(reviewId: string, note?: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.from("reviews").update({ status: "removed" }).eq("id", reviewId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, "review", reviewId, "review_removed", null, { note });
  revalidateModeration();
}

// --- Error reports ("Сообщить об ошибке") ---

export async function closeErrorReport(reportId: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.from("error_reports").update({ status: "closed" }).eq("id", reportId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, "error_report", reportId, "error_report_closed", null, null);
  revalidateModeration();
}

export async function reopenErrorReport(reportId: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.from("error_reports").update({ status: "open" }).eq("id", reportId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, "error_report", reportId, "error_report_reopened", null, null);
  revalidateModeration();
}

// --- Supplier suggestions ("Не нашли поставщика? Добавьте его") ---

export async function approveSuggestion(suggestionId: string, note?: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("supplier_suggestions")
    .update({ status: "approved" })
    .eq("id", suggestionId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, "supplier_suggestion", suggestionId, "suggestion_approved", null, { note });
  revalidateModeration();
}

export async function rejectSuggestion(suggestionId: string, note?: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("supplier_suggestions")
    .update({ status: "rejected" })
    .eq("id", suggestionId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, "supplier_suggestion", suggestionId, "suggestion_rejected", null, { note });
  revalidateModeration();
}

// --- Supplier applications ("Стать поставщиком") ---
// Approving creates the actual (unverified) supplier row from the submitted data, per spec:
// the applicant is never auto-granted a "verified" badge just for applying.

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
  return (
    transliterated
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "supplier"
  );
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  base: string,
): Promise<string> {
  let slug = slugify(base);
  let suffix = 1;
  for (;;) {
    const { data } = await supabase.from("suppliers").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    suffix += 1;
    slug = `${slugify(base)}-${suffix}`;
  }
}

export async function approveApplication(applicationId: string) {
  const { supabase, userId } = await requireAdmin();

  const { data: application } = await supabase
    .from("supplier_applications")
    .select("*")
    .eq("id", applicationId)
    .single();
  if (!application) throw new Error("Заявка не найдена.");
  if (application.status === "approved") throw new Error("Заявка уже одобрена.");

  const slug = await uniqueSlug(supabase, application.company_name);

  const { data: category } = application.category_slugs?.[0]
    ? await supabase.from("categories").select("id").eq("slug", application.category_slugs[0]).maybeSingle()
    : { data: null };

  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .insert({
      slug,
      name: application.company_name,
      short_description: application.description || application.company_name,
      about: application.description || "",
      city_id: application.city_id,
      website_url: application.website,
      telegram: application.telegram,
      phone: application.phone,
      email: application.email,
      status: "published",
      verification_level: "none",
    })
    .select("id")
    .single();
  if (supplierError || !supplier) {
    throw new Error(`Не удалось создать поставщика: ${supplierError?.message ?? "неизвестная ошибка"}`);
  }

  if (category) {
    await supabase.from("supplier_categories").insert({ supplier_id: supplier.id, category_id: category.id });
  }

  const { error } = await supabase
    .from("supplier_applications")
    .update({ status: "approved" })
    .eq("id", applicationId);
  if (error) throw new Error(error.message);

  await logAudit(supabase, userId, "supplier_application", applicationId, "application_approved", null, {
    supplier_id: supplier.id,
  });
  revalidateModeration();
}

export async function rejectApplication(applicationId: string, note?: string) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("supplier_applications")
    .update({ status: "rejected", reviewer_note: note || null })
    .eq("id", applicationId);
  if (error) throw new Error(error.message);
  await logAudit(supabase, userId, "supplier_application", applicationId, "application_rejected", null, { note });
  revalidateModeration();
}
