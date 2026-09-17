import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminClaimActions } from "@/components/admin/claim-actions";
import { one } from "@/lib/data/one";

const statusLabels: Record<string, string> = {
  new: "Новая",
  in_review: "На проверке",
  approved: "Одобрена",
  rejected: "Отклонена",
  more_info_requested: "Запрошены уточнения",
};

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string): string {
  const v = params[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function ClaimsQueuePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const statusFilter = readParam(params, "status") || "new";

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("ownership_claims")
    .select("id, position, phone, email, comment, status, reviewer_note, created_at, profiles!ownership_claims_user_id_fkey(display_name, telegram_username), suppliers(name, slug)")
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: claims, error } = await query;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Заявки «Это моя компания»</h1>

      <form className="flex flex-wrap items-center gap-2" method="get">
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
        >
          <option value="">Все</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm hover:border-[var(--color-ink)]"
        >
          Применить
        </button>
      </form>

      {error && <p className="text-sm text-[#b3261e]">Ошибка загрузки: {error.message}</p>}

      <div className="flex flex-col gap-3">
        {(claims ?? []).map((claim) => (
          <div key={claim.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {one(claim.suppliers)?.name} —{" "}
                {one(claim.profiles)?.display_name || one(claim.profiles)?.telegram_username || "Пользователь"}
              </p>
              <span className="rounded-full bg-[var(--color-panel)] px-2.5 py-1 text-xs">
                {statusLabels[claim.status] ?? claim.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              {[claim.position, claim.phone, claim.email].filter(Boolean).join(" · ")}
            </p>
            {claim.comment && <p className="mt-1 text-sm">{claim.comment}</p>}
            {claim.reviewer_note && (
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Заметка: {claim.reviewer_note}</p>
            )}
            <div className="mt-3">
              <AdminClaimActions claimId={claim.id} />
            </div>
          </div>
        ))}
        {(claims ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-[var(--color-ink-soft)]">Заявок нет.</p>
        )}
      </div>
    </div>
  );
}
