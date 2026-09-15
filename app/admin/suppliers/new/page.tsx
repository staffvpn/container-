import { getAdminCategories, getAdminCities } from "@/lib/admin/queries";
import { AdminSupplierForm } from "@/components/admin/supplier-form";
import { createSupplier } from "@/app/admin/suppliers/actions";

export default async function NewSupplierPage() {
  const [categories, cities] = await Promise.all([getAdminCategories(), getAdminCities()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Новый поставщик</h1>
      <AdminSupplierForm
        action={createSupplier}
        categories={categories}
        cities={cities}
        submitLabel="Создать"
      />
    </div>
  );
}
