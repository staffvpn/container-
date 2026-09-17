import type { Metadata } from "next";
import { one } from "@/lib/data/one";
import Link from "next/link";
import { getCategories, getCities } from "@/lib/data/suppliers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BecomeSupplierSection } from "@/components/become-supplier-section";

export const metadata: Metadata = {
  title: "Для поставщиков",
};

export default async function SuppliersPortalPage() {
  const [categories, cities] = await Promise.all([getCategories(), getCities()]);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myCompanies } = user
    ? await supabase.from("supplier_members").select("id, role, suppliers(id, name)").eq("user_id", user.id)
    : { data: [] };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <section className="flex flex-col gap-3 text-center">
        <h1 className="text-3xl font-semibold">Для поставщиков</h1>
        <p className="text-[var(--color-ink-soft)]">
          Разместите компанию в Грядке, чтобы заведения HoReCa находили вас напрямую, видели условия
          сотрудничества и оставляли заявки — без десятка звонков и открытых вкладок.
        </p>
      </section>

      {user && (myCompanies ?? []).length > 0 ? (
        <section className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] p-6">
          <h2 className="text-lg font-semibold">Ваши компании</h2>
          <div className="flex flex-col gap-2">
            {(myCompanies ?? []).map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span>{one(m.suppliers)?.name}</span>
                <Link
                  href={`/my-suppliers/${one(m.suppliers)?.id}`}
                  className="text-sm font-medium text-[var(--color-accent)] underline"
                >
                  Управлять
                </Link>
              </div>
            ))}
          </div>
          <Link
            href="/my-suppliers"
            className="self-start rounded-full border border-[var(--color-line)] px-4 py-2 text-sm hover:border-[var(--color-ink)]"
          >
            Все мои компании
          </Link>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] p-6">
          <h2 className="text-lg font-semibold">Ваша компания уже есть на Грядке?</h2>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Найдите карточку компании в каталоге и нажмите «Это моя компания» на странице профиля — заявку
            рассмотрит администратор, и вы получите доступ к управлению.
          </p>
          <Link
            href="/suppliers"
            className="self-start rounded-full border border-[var(--color-line)] px-4 py-2 text-sm hover:border-[var(--color-ink)]"
          >
            Найти компанию в каталоге
          </Link>
        </section>
      )}

      <BecomeSupplierSection categories={categories} cities={cities} />
    </main>
  );
}
