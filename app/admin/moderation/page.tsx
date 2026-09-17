import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ReviewModerationActions,
  ErrorReportActions,
  SuggestionActions,
  ApplicationActions,
  ComplaintActions,
  ProfileChangeActions,
} from "@/components/admin/moderation-actions";
import { formatAuditValues } from "@/lib/admin/audit-format";
import { one } from "@/lib/data/one";

const issueTypeLabels: Record<string, string> = {
  wrong_phone: "Неверный телефон",
  wrong_website: "Неверный сайт",
  company_closed: "Компания больше не работает",
  wrong_address: "Неверный адрес",
  wrong_category: "Неправильная категория",
  other: "Другое",
};

const complaintReasonLabels: Record<string, string> = {
  fraud: "Мошенничество",
  not_exists: "Компания не существует",
  wrong_info: "Неверная информация",
  spam: "Спам",
  rules_violation: "Нарушение правил",
  other: "Другое",
};

const complaintStatusLabels: Record<string, string> = {
  new: "Новая",
  in_review: "В работе",
  resolved: "Решена",
  closed: "Закрыта",
};

type SearchParams = Record<string, string | string[] | undefined>;
function readParam(params: SearchParams, key: string): string {
  const v = params[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

const tabs = [
  { key: "applications", label: "Заявки на регистрацию" },
  { key: "suggestions", label: "Добавить поставщика" },
  { key: "reviews", label: "Отзывы" },
  { key: "errors", label: "Сообщения об ошибках" },
  { key: "complaints", label: "Жалобы" },
  { key: "profile_changes", label: "Изменения профилей" },
] as const;

export default async function ModerationPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const tab = readParam(params, "tab") || "applications";
  const supabase = await createServerSupabaseClient();

  const [
    { data: pendingApplications },
    { data: allApplications },
    { data: pendingSuggestions },
    { data: allSuggestions },
    { data: pendingReviews },
    { data: allReviews },
    { data: openReports },
    { data: allReports },
  ] = await Promise.all([
    supabase.from("supplier_applications").select("id").eq("status", "pending"),
    supabase.from("supplier_applications").select("id, company_name, contact_name, phone, email, website, telegram, description, address, status, reviewer_note, created_at, cities(name)").order("created_at", { ascending: false }).limit(100),
    supabase.from("supplier_suggestions").select("id").eq("status", "pending"),
    supabase.from("supplier_suggestions").select("id, name, website, comment, status, created_at, cities(name), categories(name), profiles!user_id(display_name, telegram_username)").order("created_at", { ascending: false }).limit(100),
    supabase.from("reviews").select("id").eq("status", "pending"),
    supabase.from("reviews").select("id, overall_rating, price_rating, quality_rating, delivery_rating, service_rating, comment, status, created_at, profiles!user_id(display_name, telegram_username), suppliers!inner(name, slug)").order("created_at", { ascending: false }).limit(100),
    supabase.from("error_reports").select("id").eq("status", "open"),
    supabase.from("error_reports").select("id, issue_type, comment, status, created_at, profiles!user_id(display_name, telegram_username), suppliers!inner(name, slug)").order("created_at", { ascending: false }).limit(100),
  ]);

  const { data: newComplaints } = await supabase.from("complaints").select("id").eq("status", "new");
  const { data: allComplaints } = await supabase
    .from("complaints")
    .select("id, entity_type, entity_id, reason, description, status, admin_note, created_at, profiles!user_id(display_name, telegram_username)")
    .order("created_at", { ascending: false })
    .limit(100);

  const supplierComplaintIds = (allComplaints ?? []).filter((c) => c.entity_type === "supplier").map((c) => c.entity_id);
  const { data: complaintSuppliers } =
    supplierComplaintIds.length > 0
      ? await supabase.from("suppliers").select("id, name, slug").in("id", supplierComplaintIds)
      : { data: [] };
  const supplierById = new Map((complaintSuppliers ?? []).map((s) => [s.id, s]));

  const { data: pendingProfileChanges } = await supabase
    .from("suppliers")
    .select("*, profiles!pending_changes_submitted_by(display_name, telegram_username)")
    .not("pending_changes", "is", null)
    .order("pending_changes_submitted_at", { ascending: false });

  const counts = {
    applications: pendingApplications?.length ?? 0,
    suggestions: pendingSuggestions?.length ?? 0,
    reviews: pendingReviews?.length ?? 0,
    errors: openReports?.length ?? 0,
    complaints: newComplaints?.length ?? 0,
    profile_changes: pendingProfileChanges?.length ?? 0,
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Модерация</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/moderation?tab=${t.key}`}
            className={`rounded-full border px-4 py-2 text-sm ${
              tab === t.key ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line)] hover:border-[var(--color-ink)]"
            }`}
          >
            {t.label}
            {counts[t.key as keyof typeof counts] > 0 && (
              <span className="ml-2 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs text-white">
                {counts[t.key as keyof typeof counts]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {tab === "applications" && (
        <div className="flex flex-col gap-3">
          {(allApplications ?? []).map((a) => (
            <div key={a.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{a.company_name} — {a.contact_name}</p>
                <span className="rounded-full bg-[var(--color-panel)] px-2.5 py-1 text-xs">{a.status}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                {[one(a.cities)?.name, a.phone, a.email, a.website, a.telegram].filter(Boolean).join(" · ")}
              </p>
              {a.description && <p className="mt-1 text-sm">{a.description}</p>}
              {a.address && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Адрес: {a.address}</p>}
              {a.reviewer_note && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Заметка: {a.reviewer_note}</p>}
              {a.status === "pending" && (
                <div className="mt-3">
                  <ApplicationActions applicationId={a.id} />
                </div>
              )}
            </div>
          ))}
          {(allApplications ?? []).length === 0 && <p className="p-6 text-center text-sm text-[var(--color-ink-soft)]">Заявок нет.</p>}
        </div>
      )}

      {tab === "suggestions" && (
        <div className="flex flex-col gap-3">
          {(allSuggestions ?? []).map((s) => (
            <div key={s.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{s.name}</p>
                <span className="rounded-full bg-[var(--color-panel)] px-2.5 py-1 text-xs">{s.status}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                {[one(s.cities)?.name, one(s.categories)?.name, s.website].filter(Boolean).join(" · ")}
              </p>
              {s.comment && <p className="mt-1 text-sm">{s.comment}</p>}
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                От: {one(s.profiles)?.display_name || one(s.profiles)?.telegram_username || "Пользователь"}
              </p>
              {s.status === "pending" && (
                <div className="mt-3">
                  <SuggestionActions suggestionId={s.id} />
                </div>
              )}
            </div>
          ))}
          {(allSuggestions ?? []).length === 0 && <p className="p-6 text-center text-sm text-[var(--color-ink-soft)]">Предложений нет.</p>}
        </div>
      )}

      {tab === "reviews" && (
        <div className="flex flex-col gap-3">
          {(allReviews ?? []).map((r) => (
            <div key={r.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{one(r.suppliers)?.name} · ★ {r.overall_rating}</p>
                <span className="rounded-full bg-[var(--color-panel)] px-2.5 py-1 text-xs">{r.status}</span>
              </div>
              <p className="mt-1 text-sm">{r.comment}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                {one(r.profiles)?.display_name || one(r.profiles)?.telegram_username || "Пользователь"} · {new Date(r.created_at).toLocaleDateString("ru-RU")}
              </p>
              <div className="mt-3">
                <ReviewModerationActions reviewId={r.id} status={r.status} />
              </div>
            </div>
          ))}
          {(allReviews ?? []).length === 0 && <p className="p-6 text-center text-sm text-[var(--color-ink-soft)]">Отзывов нет.</p>}
        </div>
      )}

      {tab === "errors" && (
        <div className="flex flex-col gap-3">
          {(allReports ?? []).map((r) => (
            <div key={r.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{one(r.suppliers)?.name} — {issueTypeLabels[r.issue_type] ?? r.issue_type}</p>
                <span className="rounded-full bg-[var(--color-panel)] px-2.5 py-1 text-xs">{r.status === "open" ? "Открыто" : "Закрыто"}</span>
              </div>
              {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                {one(r.profiles)?.display_name || one(r.profiles)?.telegram_username || "Пользователь"} · {new Date(r.created_at).toLocaleDateString("ru-RU")}
              </p>
              <div className="mt-3">
                <ErrorReportActions reportId={r.id} status={r.status} />
              </div>
            </div>
          ))}
          {(allReports ?? []).length === 0 && <p className="p-6 text-center text-sm text-[var(--color-ink-soft)]">Сообщений нет.</p>}
        </div>
      )}

      {tab === "complaints" && (
        <div className="flex flex-col gap-3">
          {(allComplaints ?? []).map((c) => {
            const supplier = c.entity_type === "supplier" ? supplierById.get(c.entity_id) : undefined;
            return (
              <div key={c.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {supplier ? supplier.name : `${c.entity_type} ${c.entity_id.slice(0, 8)}`} — {complaintReasonLabels[c.reason] ?? c.reason}
                  </p>
                  <span className="rounded-full bg-[var(--color-panel)] px-2.5 py-1 text-xs">{complaintStatusLabels[c.status] ?? c.status}</span>
                </div>
                {c.description && <p className="mt-1 text-sm">{c.description}</p>}
                {c.admin_note && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Заметка: {c.admin_note}</p>}
                <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                  {one(c.profiles)?.display_name || one(c.profiles)?.telegram_username || "Пользователь"} · {new Date(c.created_at).toLocaleDateString("ru-RU")}
                </p>
                <div className="mt-3">
                  <ComplaintActions complaintId={c.id} supplierEntityId={supplier?.id} />
                </div>
              </div>
            );
          })}
          {(allComplaints ?? []).length === 0 && <p className="p-6 text-center text-sm text-[var(--color-ink-soft)]">Жалоб нет.</p>}
        </div>
      )}

      {tab === "profile_changes" && (
        <div className="flex flex-col gap-3">
          {(pendingProfileChanges ?? []).map((s) => {
            const pending = (s.pending_changes ?? {}) as Record<string, unknown>;
            const oldSubset: Record<string, unknown> = {};
            for (const key of Object.keys(pending)) {
              if (key === "category_ids" || key === "service_city_ids") continue;
              oldSubset[key] = (s as Record<string, unknown>)[key];
            }
            const { category_ids: _newCategoryIds, service_city_ids: _newServiceCityIds, ...pendingWithoutJunctions } = pending;
            const fields = formatAuditValues(oldSubset, pendingWithoutJunctions);
            return (
              <div key={s.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <a href={`/admin/suppliers/${s.id}`} className="font-medium underline">{s.name}</a>
                  <span className="text-xs text-[var(--color-ink-soft)]">
                    {one(s.profiles)?.display_name || one(s.profiles)?.telegram_username || "Пользователь"} ·{" "}
                    {s.pending_changes_submitted_at && new Date(s.pending_changes_submitted_at).toLocaleString("ru-RU")}
                  </span>
                </div>
                {fields.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Нет отличий от текущей версии.</p>
                ) : (
                  <dl className="mt-2 flex flex-col gap-1 rounded-[var(--radius-sm)] bg-[var(--color-panel)] p-3 text-sm">
                    {fields.map((f, i) => (
                      <div key={i} className="flex flex-wrap gap-1">
                        <dt className="text-[var(--color-ink-soft)]">{f.label}:</dt>
                        <dd>
                          <span className="text-[var(--color-ink-soft)] line-through">{f.oldText}</span>
                          {" → "}
                          <span className="font-medium">{f.newText}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="mt-3">
                  <ProfileChangeActions supplierId={s.id} />
                </div>
              </div>
            );
          })}
          {(pendingProfileChanges ?? []).length === 0 && <p className="p-6 text-center text-sm text-[var(--color-ink-soft)]">Изменений на проверке нет.</p>}
        </div>
      )}
    </div>
  );
}
