import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminCategories, getAdminCities } from "@/lib/admin/queries";
import { AdminSupplierForm } from "@/components/admin/supplier-form";
import { AddressManager } from "@/components/admin/address-manager";
import { SupplierMembers } from "@/components/admin/supplier-members";
import { LogoUploader } from "@/components/admin/logo-uploader";
import { AdminSupplierActions } from "@/components/admin/supplier-actions";
import { NewsManager } from "@/components/admin/news-manager";
import { updateSupplier } from "@/app/admin/suppliers/actions";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string): string {
  const v = params[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function EditSupplierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { memberQuery = "" } = await searchParams.then((p) => ({ memberQuery: readParam(p, "memberQuery") }));
  const supabase = await createServerSupabaseClient();

  const [
    { data: supplier },
    categories,
    cities,
    { data: categoryLinks },
    { data: cityLinks },
    { data: addresses },
    { data: memberRows },
    { data: invitationRows },
  ] = await Promise.all([
    supabase.from("suppliers").select("*").eq("id", id).maybeSingle(),
    getAdminCategories(),
    getAdminCities(),
    supabase.from("supplier_categories").select("category_id").eq("supplier_id", id),
    supabase.from("supplier_service_cities").select("city_id").eq("supplier_id", id),
    supabase.from("supplier_addresses").select("*").eq("supplier_id", id).order("is_primary", { ascending: false }),
    supabase
      .from("supplier_members")
      .select("id, role, user_id, profiles!user_id(display_name, telegram_username)")
      .eq("supplier_id", id),
    supabase
      .from("ownership_invitations")
      .select("id, role_offered, status, invited_user_id, profiles!ownership_invitations_invited_user_id_fkey(display_name, telegram_username)")
      .eq("supplier_id", id)
      .eq("status", "pending"),
  ]);

  if (!supplier) notFound();

  const { data: newsRows } = await supabase
    .from("news")
    .select("id, title, content, status, created_at")
    .eq("supplier_id", id)
    .order("created_at", { ascending: false });

  let searchResults: { id: string; display_name: string | null; telegram_username: string | null }[] = [];
  if (memberQuery) {
    const memberUserIds = (memberRows ?? []).map((m) => m.user_id);
    let query = supabase
      .from("profiles")
      .select("id, display_name, telegram_username")
      .or(`display_name.ilike.%${memberQuery}%,telegram_username.ilike.%${memberQuery}%`)
      .limit(10);
    if (memberUserIds.length > 0) query = query.not("id", "in", `(${memberUserIds.join(",")})`);
    const { data } = await query;
    searchResults = data ?? [];
  }

  const boundUpdate = updateSupplier.bind(null, id);

  const members = (memberRows ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    user_id: m.user_id,
    display_name: m.profiles?.display_name ?? null,
    telegram_username: m.profiles?.telegram_username ?? null,
  }));
  const invitations = (invitationRows ?? []).map((inv) => ({
    id: inv.id,
    role_offered: inv.role_offered,
    status: inv.status,
    invited_user_id: inv.invited_user_id,
    display_name: inv.profiles?.display_name ?? null,
    telegram_username: inv.profiles?.telegram_username ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{supplier.name}</h1>
        <Link
          href={`/my-suppliers/${id}`}
          className="rounded-full border border-[var(--color-line)] px-4 py-1.5 text-sm hover:border-[var(--color-ink)]"
        >
          Управлять от имени владельца
        </Link>
      </div>
      <div className="max-w-3xl">
        <LogoUploader supplierId={id} currentUrl={supplier.logo_url} />
      </div>
      <div className="max-w-3xl">
        <h2 className="mb-3 text-lg font-semibold">Статус и удаление</h2>
        <AdminSupplierActions supplierId={id} status={supplier.status} isDeleted={!!supplier.deleted_at} />
      </div>
      <AdminSupplierForm
        key={supplier.updated_at}
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

      <div className="max-w-3xl">
        <h2 className="mb-3 text-lg font-semibold">Адреса и точки</h2>
        <AddressManager supplierId={id} addresses={addresses ?? []} cities={cities} />
      </div>

      <div className="max-w-3xl">
        <h2 className="mb-3 text-lg font-semibold">Новости</h2>
        <NewsManager supplierId={id} news={newsRows ?? []} />
      </div>

      <div className="max-w-3xl">
        <h2 className="mb-3 text-lg font-semibold">Владелец и участники</h2>
        <SupplierMembers
          supplierId={id}
          members={members}
          invitations={invitations}
          searchResults={searchResults}
          searchQuery={memberQuery}
        />
      </div>
    </div>
  );
}
