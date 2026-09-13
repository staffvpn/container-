import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupplierBySlug } from "@/lib/data/suppliers";
import { offers } from "@/lib/data/fixtures/offers";
import { cities } from "@/lib/data/fixtures/cities";
import { categories } from "@/lib/data/fixtures/categories";
import { SupplierLogo } from "@/components/supplier-logo";
import { ShareButton } from "@/components/share-button";

const statusLabel: Record<string, string | null> = {
  unverified: null,
  confirmed: "Профиль подтвержден",
  verified: "Проверен Контейнером",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);
  if (!supplier) {
    return { title: "Поставщик не найден — Контейнер" };
  }
  return {
    title: `${supplier.name} — Контейнер`,
    description: supplier.shortDescription,
  };
}

export default async function SupplierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);
  if (!supplier) notFound();

  const cityName = cities.find((c) => c.slug === supplier.city)?.name ?? supplier.city;
  const categoryList = supplier.categories
    .map((catSlug) => categories.find((c) => c.slug === catSlug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const supplierOffers = offers.filter((o) => o.supplierSlug === supplier.slug);
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
              className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Перейти на сайт
            </a>
          )}
          {supplier.contacts.phone && (
            <a
              href={`tel:${supplier.contacts.phone}`}
              className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm hover:border-[var(--color-ink)]"
            >
              Позвонить
            </a>
          )}
          {supplier.contacts.telegram && (
            <a
              href={supplier.contacts.telegram}
              className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm hover:border-[var(--color-ink)]"
            >
              Telegram
            </a>
          )}
          <ShareButton title={supplier.name} url={`https://container.example/supplier/${supplier.slug}`} />
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
