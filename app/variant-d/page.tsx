import { getSuppliers, getCategories } from "@/lib/data/suppliers";
import { cities } from "@/lib/data/fixtures/cities";
import { inter, jetbrainsMono } from "@/lib/variant-fonts";

export default async function VariantD() {
  const [categories, suppliers] = await Promise.all([getCategories(), getSuppliers()]);
  const stats = [
    { label: "ПОСТАВЩИКОВ", value: suppliers.length },
    { label: "ГОРОДОВ", value: cities.length },
    { label: "КАТЕГОРИЙ", value: categories.length },
  ];

  return (
    <main
      className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-white font-[family-name:var(--font-variant-d-body)] text-[#111827]`}
    >
      <header className="flex items-center justify-between border-b border-[#e5e7eb] px-8 py-5">
        <span className="text-lg font-semibold tracking-tight">Контейнер</span>
        <nav className="hidden gap-8 text-sm text-[#6b7280] md:flex">
          <span className="border-b-2 border-[#0f7a6b] pb-4 -mb-4 text-[#0f7a6b]">Поставщики</span>
          <span>Карта</span>
          <span>Предложения</span>
        </nav>
        <span className="rounded border border-[#e5e7eb] px-4 py-2 text-sm">Профиль</span>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-8 py-16 md:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-7">
          <h1 className="text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            Найдите поставщика для своего бизнеса
          </h1>
          <p className="max-w-md text-lg text-[#6b7280]">
            Поставщики для кофеен, ресторанов, баров и других заведений HoReCa — в одном месте.
          </p>

          <div className="flex items-center gap-3 rounded border border-[#d1d5db] px-4 py-3">
            <input
              placeholder="Найти поставщика, категорию или услугу"
              className="flex-1 bg-transparent text-base outline-none placeholder:text-[#9ca3af]"
            />
            <button className="rounded bg-[#0f7a6b] px-5 py-2 text-sm font-medium text-white">
              Найти
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 6).map((c) => (
              <span
                key={c.slug}
                className="rounded border border-[#d1d5db] px-3 py-1.5 text-sm text-[#374151]"
              >
                {c.name}
              </span>
            ))}
          </div>

          <div className="flex aspect-[16/8] items-center justify-center rounded border border-dashed border-[#d1d5db] bg-[#fafafa] text-[#9ca3af]">
            <span className="font-[family-name:var(--font-variant-d-mono)] text-xs uppercase tracking-widest">
              Фото поставщика
            </span>
          </div>
        </div>

        <div className="rounded border border-[#e5e7eb] bg-[#fafafa] p-6 font-[family-name:var(--font-variant-d-mono)]">
          <p className="mb-4 text-xs uppercase tracking-widest text-[#9ca3af]">Сводка · сейчас</p>
          <div className="flex flex-col gap-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between border-b border-dashed border-[#d1d5db] pb-3">
                <span className="text-xs text-[#6b7280]">{s.label}</span>
                <span className="text-3xl font-medium text-[#0f7a6b]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
