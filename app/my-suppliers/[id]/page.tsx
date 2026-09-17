import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminCategories, getAdminCities } from "@/lib/admin/queries";
import { AdminSupplierForm } from "@/components/admin/supplier-form";
import { AddressManager } from "@/components/admin/address-manager";
import { AdminSupplierActions } from "@/components/admin/supplier-actions";
import { SupplierMembers } from "@/components/admin/supplier-members";
import { LogoUploader } from "@/components/admin/logo-uploader";
import { updateSupplier } from "@/app/admin/suppliers/actions";
import { exitImpersonation } from "@/app/my-suppliers/[id]/impersonation-actions";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string): string {
  const v = params[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function MySupplierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const memberQuery = readParam(resolvedSearchParams, "memberQuery");
  const statsPeriod = readParam(resolvedSearchParams, "period") || "30";
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/profile");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const { data: myMembership } = await supabase
    .from("supplier_members")
    .select("role")
    .eq("supplier_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isPlatformAdmin = profile?.role === "admin";
  const isImpersonating = isPlatformAdmin && !myMembership;

  if (isImpersonating) {
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentEntry } = await supabase
      .from("audit_log")
      .select("id")
      .eq("entity_type", "supplier")
      .eq("entity_id", id)
      .eq("action", "impersonation_started")
      .eq("actor_user_id", user.id)
      .gte("created_at", since)
      .maybeSingle();
    if (!recentEntry) {
      await supabase.from("audit_log").insert({
        actor_user_id: user.id,
        actor_role: "platform_admin",
        entity_type: "supplier",
        entity_id: id,
        action: "impersonation_started",
        old_value: null,
        new_value: null,
      });
    }
  }
  const actingAs: "platform_admin" | "owner" | "admin" | "editor" | "viewer" | null = isPlatformAdmin
    ? "platform_admin"
    : (myMembership?.role as "owner" | "admin" | "editor" | "viewer" | undefined) ?? null;

  if (!actingAs) {
    return (
      <main className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-xl font-semibold">Доступ запрещён</h1>
        <p className="text-[var(--color-ink-soft)]">У вас нет доступа к этой карточке поставщика.</p>
      </main>
    );
  }

  const canEdit = actingAs !== "viewer";
  const canManageMembers = actingAs === "owner" || actingAs === "admin" || actingAs === "platform_admin";
  const isOwnerLevel = actingAs === "owner" || actingAs === "platform_admin";

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
    canManageMembers
      ? supabase.from("supplier_members").select("id, role, user_id, profiles!user_id(display_name, telegram_username)").eq("supplier_id", id)
      : Promise.resolve({ data: [] }),
    canManageMembers
      ? supabase
          .from("ownership_invitations")
          .select("id, role_offered, status, invited_user_id, profiles!ownership_invitations_invited_user_id_fkey(display_name, telegram_username)")
          .eq("supplier_id", id)
          .eq("status", "pending")
      : Promise.resolve({ data: [] }),
  ]);

  if (!supplier) notFound();

  const statsSince =
    statsPeriod === "all"
      ? null
      : new Date(Date.now() - Number(statsPeriod) * 24 * 60 * 60 * 1000).toISOString();
  let statsEventsQuery = supabase.from("analytics_events").select("event_type").eq("supplier_id", id);
  if (statsSince) statsEventsQuery = statsEventsQuery.gte("created_at", statsSince);
  const { data: statsEvents } = await statsEventsQuery;
  const statsCounts = (statsEvents ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] ?? 0) + 1;
    return acc;
  }, {});

  let searchResults: { id: string; display_name: string | null; telegram_username: string | null }[] = [];
  if (memberQuery && canManageMembers) {
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

  const boundUpdate = updateSupplier.bind(null, id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      {isImpersonating && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[#fff4d6] px-4 py-3 text-sm">
          <p>Вы управляете карточкой от имени администратора платформы.</p>
          <form action={exitImpersonation.bind(null, id)}>
            <button type="submit" className="shrink-0 rounded-full border border-[var(--color-ink)] px-4 py-1.5 font-medium hover:bg-white">
              Выйти из режима управления
            </button>
          </form>
        </div>
      )}

      <h1 className="text-2xl font-semibold">{supplier.name}</h1>

      {canEdit && <LogoUploader supplierId={id} currentUrl={supplier.logo_url} />}

      {!canEdit ? (
        <ReadOnlySupplierView supplier={supplier} cities={cities} categories={categories} categoryLinks={categoryLinks ?? []} />
      ) : (
        <AdminSupplierForm
          key={supplier.updated_at}
          action={boundUpdate}
          categories={categories}
          cities={cities}
          submitLabel="Сохранить"
          showAdminFields={isOwnerLevel}
          defaults={{
            ...supplier,
            category_ids: (categoryLinks ?? []).map((l) => l.category_id),
            service_city_ids: (cityLinks ?? []).map((l) => l.city_id),
          }}
        />
      )}

      {isOwnerLevel && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Статус и удаление</h2>
          <AdminSupplierActions supplierId={id} status={supplier.status} isDeleted={!!supplier.deleted_at} />
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Статистика</h2>
          <div className="flex gap-2">
            {[
              { key: "7", label: "7 дней" },
              { key: "30", label: "30 дней" },
              { key: "90", label: "90 дней" },
              { key: "all", label: "Весь период" },
            ].map((p) => (
              <a
                key={p.key}
                href={`?period=${p.key}`}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  statsPeriod === p.key ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line)] hover:border-[var(--color-ink)]"
                }`}
              >
                {p.label}
              </a>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Просмотры профиля", value: statsCounts.view_supplier ?? 0 },
            { label: "Переходы на сайт", value: statsCounts.click_website ?? 0 },
            { label: "Клики Telegram", value: statsCounts.click_telegram ?? 0 },
            { label: "Клики телефона", value: statsCounts.click_phone ?? 0 },
            { label: "Копирований промокодов", value: statsCounts.copy_promo ?? 0 },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
              <span className="text-xl font-semibold">{s.value}</span>
              <span className="text-xs text-[var(--color-ink-soft)]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Адреса и точки</h2>
        {canEdit ? (
          <AddressManager supplierId={id} addresses={addresses ?? []} cities={cities} />
        ) : (
          <p className="text-sm text-[var(--color-ink-soft)]">
            {(addresses ?? []).length} адрес(ов). Только просмотр — редактирование недоступно для вашей роли.
          </p>
        )}
      </div>

      {canManageMembers && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Владелец и участники</h2>
          <SupplierMembers
            supplierId={id}
            members={members}
            invitations={invitations}
            searchResults={searchResults}
            searchQuery={memberQuery}
            canAssignOwner={actingAs === "platform_admin"}
            canTransferOwnership={isOwnerLevel}
          />
        </div>
      )}
    </div>
  );
}

function ReadOnlySupplierView({
  supplier,
  categories,
  categoryLinks,
}: {
  supplier: { name: string; short_description: string; about: string; status: string };
  cities: { id: string; name: string }[];
  categories: { id: string; slug: string; name: string }[];
  categoryLinks: { category_id: string }[];
}) {
  const categoryNames = categoryLinks
    .map((l) => categories.find((c) => c.id === l.category_id)?.name)
    .filter(Boolean);
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
      <p className="text-sm text-[var(--color-ink-soft)]">У вас доступ только для просмотра.</p>
      <p className="font-medium">{supplier.short_description}</p>
      <p>{supplier.about}</p>
      {categoryNames.length > 0 && <p className="text-sm text-[var(--color-ink-soft)]">Категории: {categoryNames.join(", ")}</p>}
      <p className="text-sm text-[var(--color-ink-soft)]">Статус: {supplier.status}</p>
    </div>
  );
}
