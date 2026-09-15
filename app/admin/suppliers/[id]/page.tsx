import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminCategories, getAdminCities } from "@/lib/admin/queries";
import { AdminSupplierForm } from "@/components/admin/supplier-form";
import { updateSupplier } from "@/app/admin/suppliers/actions";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [{ data: supplier }, categories, cities, { data: categoryLinks }, { data: cityLinks }] =
    await Promise.all([
      supabase.from("suppliers").select("*").eq("id", id).maybeSingle(),
      getAdminCategories(),
      getAdminCities(),
      supabase.from("supplier_categories").select("category_id").eq("supplier_id", id),
      supabase.from("supplier_service_cities").select("city_id").eq("supplier_id", id),
    ]);

  if (!supplier) notFound();

  const boundUpdate = updateSupplier.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{supplier.name}</h1>
      <AdminSupplierForm
        action={boundUpdate}
        categories={categories}
        cities={cities}
        submitLabel="Сохранить"
        defaults={{
          ...supplier,
          category_ids: (categoryLinks ?? []).map((l) => l.category_id),
          service_city_ids: (cityLinks ?? []).map((l) => l.city_id),
        }}
      />
    </div>
  );
}
