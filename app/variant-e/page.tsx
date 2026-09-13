import { getSuppliers, getCategories } from "@/lib/data/suppliers";
import { cities } from "@/lib/data/fixtures/cities";
import { robotoSlab, golosText } from "@/lib/variant-fonts";

export default async function VariantE() {
  const [categories, suppliers] = await Promise.all([getCategories(), getSuppliers()]);
  const stats = [
    { value: suppliers.length, label: "поставщиков" },
    { value: cities.length, label: "городов" },
    { value: categories.length, label: "категорий" },
  ];

  return (
    <main
      className={`${robotoSlab.variable} ${golosText.variable} min-h-screen bg-[#faf9f5] font-[family-name:var(--font-variant-b-body)] text-[#1a1a1a]`}
    >
      <header className="flex items-center justify-between border-b-4 border-[#1a1a1a] px-8 py-5">
        <span className="font-[family-name:var(--font-variant-e)] text-xl font-bold">Контейнер</span>
        <nav className="hidden gap-8 text-sm md:flex">
          <span>Поставщики</span>
          <span>Карта</span>
          <span>Предложения</span>
        </nav>
        <span className="border-2 border-[#1a1a1a] px-4 py-2 text-sm font-medium">Профиль</span>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-8 py-16 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-7">
          <h1 className="font-[family-name:var(--font-variant-e)] text-5xl font-bold leading-[1.05] md:text-6xl">
            Найдите поставщика для своего бизнеса
          </h1>
          <p className="max-w-md text-lg text-[#4a4a4a]">
            Поставщики для кофеен, ресторанов, баров и других заведений HoReCa — в одном месте.
          </p>

          <div className="flex items-center gap-2 border-2 border-[#1a1a1a] p-2">
            <input
              placeholder="Найти поставщика, категорию или услугу"
              className="flex-1 bg-transparent px-3 py-2 text-base outline-none placeholder:text-[#8a8a8a]"
            />
            <button className="bg-[#1a1a1a] px-5 py-3 text-sm font-medium text-[#faf9f5]">
              Найти
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 6).map((c) => (
              <span key={c.slug} className="border border-[#1a1a1a] px-3 py-1.5 text-sm">
                {c.name}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex flex-col gap-4">
          <div className="flex aspect-[4/5] items-center justify-center border-4 border-[#1f4d3a] bg-[#1f4d3a]/5 text-[#1f4d3a]">
            <span className="font-[family-name:var(--font-variant-e)] text-sm font-bold uppercase tracking-widest">
              Фото поставщика
            </span>
          </div>
          <div className="absolute -left-6 -top-6 flex h-28 w-28 rotate-[-12deg] items-center justify-center rounded-full border-4 border-[#c23b22] text-center">
            <span className="font-[family-name:var(--font-variant-e)] text-xs font-bold uppercase leading-tight tracking-wider text-[#c23b22]">
              Проверено
              <br />
              Контейнером
            </span>
          </div>
        </div>
      </section>

      <section className="bg-[#1f4d3a] px-8 py-14 text-[#faf9f5]">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <span className="font-[family-name:var(--font-variant-e)] text-5xl font-bold">
                {s.value}
              </span>
              <span className="text-sm text-[#c9d6cd]">{s.label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
