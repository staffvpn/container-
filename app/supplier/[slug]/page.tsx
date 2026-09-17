import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupplierBySlug, getOffers, getCities, getCategories, getReviews, getSupplierAddresses } from "@/lib/data/suppliers";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { SupplierLogo } from "@/components/supplier-logo";
import { ShareButton } from "@/components/share-button";
import { ReviewsList } from "@/components/reviews-list";
import { ReviewForm } from "@/components/review-form";
import { ErrorReportButton } from "@/components/error-report-button";
import { TrackedLink } from "@/components/tracked-link";
import { ClaimOwnershipSection } from "@/components/claim-ownership-section";
import { ComplaintButton } from "@/components/complaint-button";

export const runtime = "edge";

const statusLabel: Record<string, string | null> = {
  unverified: null,
  confirmed: "Профиль подтвержден",
  verified: "Проверен Грядкой",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);
  if (!supplier) {
    return { title: "Поставщик не найден" };
  }
  return {
    title: supplier.name,
    description: supplier.shortDescription,
    alternates: { canonical: `/supplier/${supplier.slug}` },
    openGraph: {
      title: supplier.name,
      description: supplier.shortDescription,
      url: `/supplier/${supplier.slug}`,
      type: "profile",
    },
  };
}

export default async function SupplierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);
  if (!supplier) notFound();

  void createSupabasePublicClient()
    .from("analytics_events")
    .insert({ event_type: "view_supplier", supplier_id: supplier.id, source_page: "supplier_page" })
    .then(() => {});

  const [cities, categories, supplierOffers, reviews, addresses, { data: news }] = await Promise.all([
    getCities(),
    getCategories(),
    getOffers(supplier.slug),
    getReviews(supplier.slug),
    getSupplierAddresses(supplier.slug),
    createSupabasePublicClient()
      .from("news")
      .select("id, title, content, created_at")
      .eq("supplier_id", supplier.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const cityName = cities.find((c) => c.slug === supplier.city)?.name ?? supplier.city;
  const categoryList = supplier.categories
    .map((catSlug) => categories.find((c) => c.slug === catSlug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const status = statusLabel[supplier.status];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
      <section className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <SupplierLogo name={supplier.name} />
          <div>
            <h1 className="text-2xl font-semibold">{supplier.name}</h1>
            <p className="text-sm text-[var(--color-ink-soft)]">
              {cityName} · ★ {supplier.rating.toFixed(1)} ({supplier.reviewCount} отзывов)
              {status && ` · ${status}`}
            </p>
          </div>
        </div>
        <p className="text-[var(--color-ink-soft)]">{supplier.shortDescription}</p>

        <div className="flex flex-wrap gap-3">
          {supplier.contacts.website && (
            <a
              href={`/api/redirect?to=${encodeURIComponent(supplier.contacts.website)}&supplier=${supplier.slug}`}
              className="rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Перейти на сайт
            </a>
          )}
          {supplier.contacts.phone && (
            <TrackedLink
              href={`tel:${supplier.contacts.phone}`}
              eventType="click_phone"
              supplierId={supplier.id}
              className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm hover:border-[var(--color-ink)]"
            >
              Позвонить
            </TrackedLink>
          )}
          {supplier.contacts.telegram && (
            <TrackedLink
              href={supplier.contacts.telegram}
              eventType="click_telegram"
              supplierId={supplier.id}
              className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm hover:border-[var(--color-ink)]"
            >
              Telegram
            </TrackedLink>
          )}
          <ShareButton title={supplier.name} url={`https://gryadka.example/supplier/${supplier.slug}`} />
        </div>
        <div className="flex items-center gap-4">
          <ErrorReportButton supplierSlug={supplier.slug} />
          <ClaimOwnershipSection supplierSlug={supplier.slug} />
          <ComplaintButton entityType="supplier" entityId={supplier.id} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Категории</h2>
        <div className="flex flex-wrap gap-2">
          {categoryList.map((category) => (
            <a
              key={category.slug}
              href={`/suppliers?category=${category.slug}`}
              className="rounded-full border border-[var(--color-line)] px-4 py-1.5 text-sm hover:border-[var(--color-ink)]"
            >
              {category.name}
            </a>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">О компании</h2>
        <p className="text-[var(--color-ink-soft)]">{supplier.about}</p>
        {supplier.foundedYear && (
          <p className="text-sm text-[var(--color-ink-soft)]">Год основания: {supplier.foundedYear}</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Условия работы</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {supplier.conditions.minOrder && (
            <ConditionRow label="Минимальный заказ" value={`от ${supplier.conditions.minOrder.toLocaleString("ru-RU")} ₽`} />
          )}
          {supplier.conditions.delivery && <ConditionRow label="Доставка" value="Есть" />}
          {supplier.conditions.pickup && <ConditionRow label="Самовывоз" value="Есть" />}
          {supplier.conditions.worksWithLegalEntities && <ConditionRow label="Работа с юрлицами" value="Да" />}
          {supplier.conditions.worksWithIndividualEntrepreneurs && (
            <ConditionRow label="Работа с ИП" value="Да" />
          )}
          {supplier.conditions.deferredPayment && <ConditionRow label="Отсрочка платежа" value="Есть" />}
          {supplier.conditions.paymentMethods.length > 0 && (
            <ConditionRow label="Способы оплаты" value={supplier.conditions.paymentMethods.join(", ")} />
          )}
        </dl>
      </section>

      {addresses.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Адреса и точки</h2>
          <div className="flex flex-col gap-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {addr.label && (
                    <span className="rounded-full bg-[var(--color-panel)] px-2.5 py-0.5 text-xs">{addr.label}</span>
                  )}
                  {addr.isPrimary && (
                    <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs text-[var(--color-accent)]">
                      Основной адрес
                    </span>
                  )}
                </div>
                <p className="mt-2 font-medium">
                  {addr.address}
                  {addr.cityName && `, ${addr.cityName}`}
                </p>
                {addr.workingHours && (
                  <p className="text-sm text-[var(--color-ink-soft)]">Часы работы: {addr.workingHours}</p>
                )}
                {addr.pickupAvailable && <p className="text-sm text-[var(--color-accent)]">Самовывоз доступен</p>}
                {addr.hasMapLocation && (
                  <a
                    href={addr.citySlug ? `/map?city=${addr.citySlug}` : "/map?all=1"}
                    className="mt-2 inline-block text-sm font-medium text-[var(--color-accent)] underline"
                  >
                    Показать на карте
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {(news ?? []).length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Новости</h2>
          <div className="flex flex-col gap-3">
            {(news ?? []).map((item) => (
              <div key={item.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{item.content}</p>
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                  {new Date(item.created_at).toLocaleDateString("ru-RU")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {supplierOffers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Предложения</h2>
          <div className="flex flex-col gap-3">
            {supplierOffers.map((offer) => (
              <div key={offer.id} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
                <h3 className="font-medium">{offer.title}</h3>
                <p className="text-sm text-[var(--color-ink-soft)]">{offer.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Отзывы</h2>
        <ReviewsList reviews={reviews} />
        <div className="mt-4 max-w-lg">
          <h3 className="mb-3 font-medium">Оставить отзыв</h3>
          <ReviewForm supplierSlug={supplier.slug} />
        </div>
      </section>
    </main>
  );
}

function ConditionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[var(--color-line)] pb-2">
      <dt className="text-[var(--color-ink-soft)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
