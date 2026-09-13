import { getSuppliers, getCategories } from "@/lib/data/suppliers";
import { cities } from "@/lib/data/fixtures/cities";
import { oswald } from "@/lib/variant-fonts";

export default async function VariantC() {
  const [categories, suppliers] = await Promise.all([getCategories(), getSuppliers()]);

  return (
    <main
      className={`${oswald.variable} min-h-screen bg-[#fafaf9] font-[family-name:var(--font-variant-c)] text-[#161616]`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 39px, #ececea 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #ececea 40px)",
      }}
    >
      <header className="flex items-center justify-between border-b border-[#161616] px-8 py-5">
        <span className="text-lg font-black tracking-tight">КОНТЕЙНЕР</span>
        <span className="rounded-none border border-[#161616] bg-[#ff5a1f] px-4 py-2 text-sm font-bold text-[#161616]">
          Профиль
        </span>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-8 py-16 md:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-8">
          <h1 className="text-6xl font-black leading-[0.9] tracking-tight md:text-7xl">
            НАЙДИТЕ
            <br />
            ПОСТАВЩИКА
            <br />
            ДЛЯ БИЗНЕСА
          </h1>
          <p className="max-w-md text-lg text-[#454545]">
            Поставщики для кофеен, ресторанов, баров и других заведений HoReCa — в одном месте.
          </p>
          <div className="flex w-full max-w-xl items-center gap-0 border-2 border-[#161616]">
            <input
              placeholder="Найти поставщика, категорию или услугу"
              className="flex-1 bg-transparent px-5 py-4 text-base outline-none placeholder:text-[#8a8a8a]"
            />
            <button className="h-full border-l-2 border-[#161616] bg-[#ff5a1f] px-6 py-4 font-bold">
              НАЙТИ
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {categories.slice(0, 6).map((c) => (
              <span
                key={c.slug}
                className="border border-[#161616] px-3 py-2 text-center text-xs font-medium"
              >
                {c.name}
              </span>
            ))}
          </div>

          <div className="flex aspect-[16/7] items-center justify-center border border-[#161616] bg-[#f0f0ee] text-[#454545]">
            <span className="text-xs font-bold uppercase tracking-widest">
              Фото склада / поставщика
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between border-2 border-dashed border-[#161616] p-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#454545]">
            Манифест
          </span>
          <div className="flex flex-col gap-6 py-8">
            <div>
              <span className="text-5xl font-black">{suppliers.length}</span>
              <p className="text-sm text-[#454545]">поставщиков</p>
            </div>
            <div>
              <span className="text-5xl font-black">{cities.length}</span>
              <p className="text-sm text-[#454545]">городов</p>
            </div>
            <div>
              <span className="text-5xl font-black">{categories.length}</span>
              <p className="text-sm text-[#454545]">категорий</p>
            </div>
          </div>
          <span className="self-end rounded-full bg-[#ff5a1f] px-3 py-1 text-xs font-bold">
            №1 в HoReCa
          </span>
        </div>
      </section>
    </main>
  );
}
