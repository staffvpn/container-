import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminCategory = { id: string; slug: string; name: string };
export type AdminCity = { id: string; slug: string; name: string };

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("categories").select("id, slug, name").order("sort_order");
  if (error) throw error;
  return data;
}

export async function getAdminCities(): Promise<AdminCity[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("cities").select("id, slug, name").order("name");
  if (error) throw error;
  return data;
}
