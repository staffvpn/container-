import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SearchParams = Record<string, string | string[] | undefined>;
function readParam(params: SearchParams, key: string): string {
  const v = params[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

const periods = [
  { key: "7", label: "7 дней" },
  { key: "30", label: "30 дней" },
  { key: "90", label: "90 дней" },
  { key: "all", label: "Весь период" },
] as const;

function periodStart(period: string): string | null {
  if (period === "all") return null;
  const days = Number(period);
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const period = readParam(params, "period") || "30";
  const since = periodStart(period);

  const supabase = await createServerSupabaseClient();

  const countQuery = (builder: ReturnType<typeof supabase.from>) =>
    builder.select("id", { count: "exact", head: true });

  const [
    { count: totalSuppliers },
    { count: publishedSuppliers },
    { count: pendingSuppliers },
    { count: blockedSuppliers },
    { count: activeOffers },
    { count: newApplications },
    { count: newSuggestions },
    { count: newReviews },
    { count: openReports },
    { count: totalUsers },
  ] = await Promise.all([
    countQuery(supabase.from("suppliers")).is("deleted_at", null),
    countQuery(supabase.from("suppliers")).eq("status", "published"),
    countQuery(supabase.from("suppliers")).eq("status", "pending"),
    countQuery(supabase.from("suppliers")).eq("status", "blocked"),
    countQuery(supabase.from("offers")).eq("status", "published"),
    countQuery(supabase.from("supplier_applications")).eq("status", "pending"),
    countQuery(supabase.from("supplier_suggestions")).eq("status", "pending"),
    countQuery(supabase.from("reviews")).eq("status", "pending"),
    countQuery(supabase.from("error_reports")).eq("status", "open"),
    countQuery(supabase.from("profiles")),
  ]);

  let eventsQuery = supabase.from("analytics_events").select("event_type");
  if (since) eventsQuery = eventsQuery.gte("created_at", since);
  const { data: events } = await eventsQuery;

  const eventCounts = (events ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] ?? 0) + 1;
    return acc;
  }, {});

  const views = eventCounts.view_supplier ?? 0;
  const searches = eventCounts.search ?? 0;
  const websiteClicks = eventCounts.click_website ?? 0;
  const telegramClicks = eventCounts.click_telegram ?? 0;
  const phoneClicks = eventCounts.click_phone ?? 0;
  const promoCopies = eventCounts.copy_promo ?? 0;
  const totalClicks = websiteClicks + telegramClicks + phoneClicks;
  const conversion = views > 0 ? ((totalClicks / views) * 100).toFixed(1) : "—";

  const kpis: { label: string; value: number | string; href?: string }[] = [
    { label: "Всего поставщиков", value: totalSuppliers ?? 0, href: "/admin/suppliers" },
    { label: "Опубликовано", value: publishedSuppliers ?? 0, href: "/admin/suppliers?status=published" },
    { label: "На модерации", value: pendingSuppliers ?? 0, href: "/admin/suppliers?status=pending" },
    { label: "Заблокировано", value: blockedSuppliers ?? 0, href: "/admin/suppliers?status=blocked" },
    { label: "Активных предложений", value: activeOffers ?? 0 },
    { label: "Новых заявок на регистрацию", value: newApplications ?? 0, href: "/admin/moderation?tab=applications" },
    { label: "Предложений добавить поставщика", value: newSuggestions ?? 0, href: "/admin/moderation?tab=suggestions" },
    { label: "Новых отзывов", value: newReviews ?? 0, href: "/admin/moderation?tab=reviews" },
    { label: "Открытых сообщений об ошибках", value: openReports ?? 0, href: "/admin/moderation?tab=errors" },
    { label: "Пользователей", value: totalUsers ?? 0, href: "/admin/admins" },
  ];

  const analyticsKpis: { label: string; value: number | string }[] = [
    { label: "Просмотры карточек", value: views },
    { label: "Поисковых запросов", value: searches },
    { label: "Переходы на сайты", value: websiteClicks },
    { label: "Клики Telegram", value: telegramClicks },
    { label: "Клики телефона", value: phoneClicks },
    { label: "Копирований промокодов", value: promoCopies },
    { label: "Конверсия просмотр → контакт", value: conversion === "—" ? conversion : `${conversion}%` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Дашборд</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) =>
          kpi.href ? (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-line)] p-4 hover:border-[var(--color-ink)]"
            >
              <span className="text-2xl font-semibold">{kpi.value}</span>
              <span className="text-xs text-[var(--color-ink-soft)]">{kpi.label}</span>
            </Link>
          ) : (
            <div key={kpi.label} className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
              <span className="text-2xl font-semibold">{kpi.value}</span>
              <span className="text-xs text-[var(--color-ink-soft)]">{kpi.label}</span>
            </div>
          ),
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Активность</h2>
          <div className="flex gap-2">
            {periods.map((p) => (
              <Link
                key={p.key}
                href={`/admin?period=${p.key}`}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  period === p.key ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line)] hover:border-[var(--color-ink)]"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {analyticsKpis.map((kpi) => (
            <div key={kpi.label} className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
              <span className="text-xl font-semibold">{kpi.value}</span>
              <span className="text-xs text-[var(--color-ink-soft)]">{kpi.label}</span>
            </div>
          ))}
        </div>
        {views === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">
            Событий за выбранный период пока нет — сбор аналитики только что подключён на страницах поставщика.
          </p>
        )}
      </div>
    </div>
  );
}
