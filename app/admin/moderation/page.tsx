import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ReviewModerationActions,
  ErrorReportActions,
  SuggestionActions,
  ApplicationActions,
} from "@/components/admin/moderation-actions";

const issueTypeLabels: Record<string, string> = {
  wrong_phone: "Неверный телефон",
  wrong_website: "Неверный сайт",
  company_closed: "Компания больше не работает",
  wrong_address: "Неверный адрес",
  wrong_category: "Неправильная категория",
  other: "Другое",
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

  const counts = {
    applications: pendingApplications?.length ?? 0,
    suggestions: pendingSuggestions?.length ?? 0,
    reviews: pendingReviews?.length ?? 0,
    errors: openReports?.length ?? 0,
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
                {[a.cities?.name, a.phone, a.email, a.website, a.telegram].filter(Boolean).join(" · ")}
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
                {[s.cities?.name, s.categories?.name, s.website].filter(Boolean).join(" · ")}
              </p>
              {s.comment && <p className="mt-1 text-sm">{s.comment}</p>}
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                От: {s.profiles?.display_name || s.profiles?.telegram_username || "Пользователь"}
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
                <p className="font-medium">{r.suppliers?.name} · ★ {r.overall_rating}</p>
                <span className="rounded-full bg-[var(--color-panel)] px-2.5 py-1 text-xs">{r.status}</span>
              </div>
              <p className="mt-1 text-sm">{r.comment}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                {r.profiles?.display_name || r.profiles?.telegram_username || "Пользователь"} · {new Date(r.created_at).toLocaleDateString("ru-RU")}
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
                <p className="font-medium">{r.suppliers?.name} — {issueTypeLabels[r.issue_type] ?? r.issue_type}</p>
                <span className="rounded-full bg-[var(--color-panel)] px-2.5 py-1 text-xs">{r.status === "open" ? "Открыто" : "Закрыто"}</span>
              </div>
              {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                {r.profiles?.display_name || r.profiles?.telegram_username || "Пользователь"} · {new Date(r.created_at).toLocaleDateString("ru-RU")}
              </p>
              <div className="mt-3">
                <ErrorReportActions reportId={r.id} status={r.status} />
              </div>
            </div>
          ))}
          {(allReports ?? []).length === 0 && <p className="p-6 text-center text-sm text-[var(--color-ink-soft)]">Сообщений нет.</p>}
        </div>
      )}
    </div>
  );
}
