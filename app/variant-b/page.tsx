import { getSuppliers, getCategories } from "@/lib/data/suppliers";
import { cities } from "@/lib/data/fixtures/cities";
import { playfairDisplay, golosText } from "@/lib/variant-fonts";

export default async function VariantB() {
  const [categories, suppliers] = await Promise.all([getCategories(), getSuppliers()]);
  const stats = [
    { value: suppliers.length, label: "поставщиков" },
    { value: cities.length, label: "городов" },
    { value: categories.length, label: "категорий" },
  ];

  return (
    <main
      className={`${playfairDisplay.variable} ${golosText.variable} min-h-screen bg-[#efefec] font-[family-name:var(--font-variant-b-body)] text-[#1b2420]`}
    >
      <header className="flex items-center justify-between border-b border-[#d8d6cf] px-8 py-5">
        <span className="font-[family-name:var(--font-variant-b-display)] text-xl font-semibold">
          Контейнер
        </span>
        <nav className="hidden gap-8 border-b border-transparent text-sm md:flex">
          <span className="border-b border-[#7a2e2e] pb-1 text-[#7a2e2e]">Поставщики</span>
          <span className="pb-1">Карта</span>
          <span className="pb-1">Предложения</span>
        </nav>
        <span className="text-sm">Профиль</span>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-8 pb-20 pt-20 text-center">
        <h1 className="font-[family-name:var(--font-variant-b-display)] text-5xl font-semibold leading-tight md:text-7xl">
          Найдите поставщика для своего бизнеса
        </h1>
        <p className="max-w-lg text-lg text-[#54594f]">
          Поставщики для кофеен, ресторанов, баров и других заведений HoReCa — в одном месте.
        </p>

        <div className="flex w-full max-w-xl items-end gap-3 border-b-2 border-[#1b2420] pb-2">
          <input
            placeholder="Найти поставщика, категорию или услугу"
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-[#9a998f]"
          />
          <button className="pb-1 text-sm font-medium uppercase tracking-wide text-[#7a2e2e]">
            Найти
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {categories.slice(0, 6).map((c, i) => (
            <span key={c.slug} className="flex items-center gap-6">
              {i > 0 && <span className="text-[#c9c7bd]">·</span>}
              <span className="border-b border-transparent hover:border-[#1b2420]">{c.name}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 pt-4">
          <div className="flex -space-x-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-11 w-11 rounded-full border-2 border-[#efefec] bg-[#dedcd2]"
              />
            ))}
          </div>
          <p className="text-left text-sm text-[#54594f]">
            Фото довольных клиентов
            <br />
            <span className="text-[#9a998f]">заведений-партнёров</span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-8 pb-16">
        <div className="flex aspect-[21/9] items-center justify-center rounded-sm border border-dashed border-[#b7b5a9] bg-[#e6e4dc] text-[#8b8a80]">
          <span className="text-xs uppercase tracking-widest">Фото заведения / поставщика</span>
        </div>
      </section>

      <section className="border-t border-[#d8d6cf] px-8 py-16">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <span className="font-[family-name:var(--font-variant-b-display)] text-5xl font-semibold text-[#7a2e2e]">
                {s.value}
              </span>
              <span className="text-sm text-[#54594f]">{s.label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
