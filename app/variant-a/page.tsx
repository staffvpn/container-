import { getSuppliers, getCategories } from "@/lib/data/suppliers";
import { cities } from "@/lib/data/fixtures/cities";
import { unbounded } from "@/lib/variant-fonts";

export default async function VariantA() {
  const [categories, suppliers] = await Promise.all([getCategories(), getSuppliers()]);
  const stats = [
    { value: suppliers.length, label: "поставщиков" },
    { value: cities.length, label: "городов" },
    { value: categories.length, label: "категорий" },
  ];

  return (
    <main className={`${unbounded.variable} min-h-screen bg-[#0e0f12] font-[family-name:var(--font-variant-a)] text-[#f5f5f2]`}>
      <header className="flex items-center justify-between px-8 py-6">
        <span className="text-lg font-bold tracking-tight">Грядка</span>
        <nav className="hidden gap-8 text-sm text-[#a6a8ad] md:flex">
          <span>Поставщики</span>
          <span>Карта</span>
          <span>Предложения</span>
        </nav>
        <span className="rounded-full border border-[#3a3d44] px-4 py-2 text-sm">Профиль</span>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-8 pb-24 pt-16 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col items-start gap-8">
          <h1 className="text-6xl font-bold leading-[0.95] tracking-tight md:text-8xl">
            Найдите
            <br />
            поставщика
            <br />
            <span className="text-[#ffb020]">за минуты</span>
          </h1>
          <p className="max-w-md text-lg text-[#a6a8ad]">
            Поставщики для кофеен, ресторанов, баров и других заведений HoReCa — в одном месте.
          </p>

          <div className="flex w-full max-w-xl items-center gap-2 rounded-full bg-white py-2 pl-6 pr-2">
            <input
              placeholder="Найти поставщика, категорию или услугу"
              className="flex-1 bg-transparent text-base text-[#0e0f12] outline-none placeholder:text-[#8a8a8a]"
            />
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0e0f12] text-white">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.7" />
                <path d="M16 16L13 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 6).map((c) => (
              <span
                key={c.slug}
                className="rounded-full border border-[#ffb020]/40 px-4 py-2 text-sm text-[#ffb020]"
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-[28px] border-2 border-dashed border-[#3a3d44] bg-white/5 text-[#6f7278]">
          <span className="text-xs font-medium uppercase tracking-widest">Фото</span>
          <span className="text-xs">склад / заведение / поставщик</span>
        </div>
      </section>

      <div className="h-1 w-full bg-gradient-to-r from-[#ffb020] via-[#ffb020]/40 to-transparent" />

      <section className="bg-[#f5f5f2] px-8 py-16 text-[#0e0f12]">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <span className="text-6xl font-bold tracking-tight">{s.value}</span>
              <span className="text-sm text-[#6b6b6b]">{s.label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
