# Грядка — Public Site Pass 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Главная, the `/suppliers` catalog, and an individual `/supplier/[slug]` profile page for Грядка, running on realistic hardcoded fixture data, establishing the typography-first design system the rest of the product reuses.

**Architecture:** Next.js App Router + TypeScript, server components fetch through a `lib/data` layer shaped exactly like future Supabase queries (async functions returning typed rows) so the backend sub-project swaps internals without touching pages. Tailwind CSS v4 with hand-picked design tokens (no shadcn). Interactive bits (search, filters, forms) are client components; everything else stays server-rendered.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Vitest 2, Node 18.18+, npm.

**Spec:** `docs/superpowers/specs/2026-09-13-public-site-design.md`

## Global Constraints

- All UI copy is in Russian.
- No AI-templated visual tropes: no gradients, no 3D objects, no heavy shadows, no shadcn default silhouette — hairline 1px borders, 8–12px radii, typography-first layout.
- Every `lib/data` export is `async` and returns the same shape a future Supabase query will — pages/components never know they're reading fixtures.
- Single placeholder font (Manrope) isolated in `lib/fonts.ts` — swapping the real brand font later touches only that file.
- Optional supplier fields with no value are omitted from the UI entirely, never rendered as "—" or "не указано".
- Package manager is npm; no other tool (pnpm/yarn) is introduced.
- Responsive target breakpoints: 360px, 390px, 768px, 1024px, 1440px — no text/image overlap at any of them.

---

### Task 1: Project scaffold (Next.js + TypeScript + Tailwind v4 + Vitest)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

**Interfaces:**
- Produces: a running `npm run dev`/`npm run build` Next.js app rooted at `/`, plus `npm test` wired to Vitest. Every later task builds inside `app/` and `lib/`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "container",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Write `postcss.config.mjs`**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 5: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules
.next
*.log
.env*.local
```

- [ ] **Step 7: Write `app/globals.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 8: Write `app/layout.tsx`**

```tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Грядка",
  description: "Платформа поставщиков для HoReCa",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Write `app/page.tsx`**

```tsx
export default function HomePage() {
  return <main>Грядка</main>;
}
```

- [ ] **Step 10: Install and verify the build**

Run: `npm install`
Run: `npm run build`
Expected: build completes with "Compiled successfully" and no type errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + TypeScript + Tailwind v4 + Vitest"
```

---

### Task 2: Design tokens, base styles, placeholder font

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `lib/fonts.ts`

**Interfaces:**
- Consumes: Task 1's `app/layout.tsx`, `app/globals.css`.
- Produces: Tailwind utility classes backed by tokens `--color-ink`, `--color-ink-soft`, `--color-paper`, `--color-surface`, `--color-line`, `--color-accent`, `--color-accent-soft`, `--radius-sm`, `--radius-md`, and font family `--font-manrope` — every later component styles against these, never raw hex values.

- [ ] **Step 1: Write `lib/fonts.ts`**

```ts
import { Manrope } from "next/font/google";

export const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});
```

- [ ] **Step 2: Add the token block to `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-manrope), system-ui, sans-serif;

  --color-ink: #14171a;
  --color-ink-soft: #5b6168;
  --color-paper: #faf9f6;
  --color-surface: #ffffff;
  --color-line: #e4e2dd;
  --color-accent: #b5451f;
  --color-accent-soft: #f3e3dc;

  --radius-sm: 8px;
  --radius-md: 12px;
}

body {
  background-color: var(--color-paper);
  color: var(--color-ink);
}
```

- [ ] **Step 3: Wire the font into `app/layout.tsx`**

```tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { manrope } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Грядка",
  description: "Платформа поставщиков для HoReCa",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: build succeeds; the visual result (paper background, ink text, Manrope font) is spot-checked manually in Task 14's responsive pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add design tokens and placeholder font"
```

---

### Task 3: Data types and fixtures

**Files:**
- Create: `lib/data/types.ts`
- Create: `lib/data/fixtures/cities.ts`
- Create: `lib/data/fixtures/categories.ts`
- Create: `lib/data/fixtures/suppliers.ts`
- Create: `lib/data/fixtures/offers.ts`
- Test: `lib/data/fixtures/fixtures.test.ts`

**Interfaces:**
- Produces: `City`, `Category`, `Supplier`, `SupplierStatus`, `SupplierConditions`, `SupplierContacts`, `Offer` types; fixture arrays `cities`, `categories`, `suppliers`, `offers`. Task 4 imports all of these.

- [ ] **Step 1: Write `lib/data/types.ts`**

```ts
export type SupplierStatus = "unverified" | "confirmed" | "verified";

export interface City {
  slug: string;
  name: string;
}

export interface Category {
  slug: string;
  name: string;
}

export interface SupplierConditions {
  delivery: boolean;
  pickup: boolean;
  minOrder?: number;
  worksWithLegalEntities: boolean;
  worksWithIndividualEntrepreneurs: boolean;
  deferredPayment: boolean;
  paymentMethods: string[];
}

export interface SupplierContacts {
  phone?: string;
  website?: string;
  telegram?: string;
}

export interface Supplier {
  slug: string;
  name: string;
  city: string;
  regions: string[];
  categories: string[];
  shortDescription: string;
  about: string;
  rating: number;
  reviewCount: number;
  status: SupplierStatus;
  conditions: SupplierConditions;
  contacts: SupplierContacts;
  foundedYear?: number;
  keywords: string[];
  updatedAt: string;
}

export interface Offer {
  id: string;
  supplierSlug: string;
  title: string;
  description: string;
  city?: string;
  category?: string;
  expiresAt?: string;
}
```

- [ ] **Step 2: Write `lib/data/fixtures/cities.ts`**

```ts
import type { City } from "../types";

export const cities: City[] = [
  { slug: "moscow", name: "Москва" },
  { slug: "spb", name: "Санкт-Петербург" },
  { slug: "kazan", name: "Казань" },
  { slug: "ekaterinburg", name: "Екатеринбург" },
  { slug: "novosibirsk", name: "Новосибирск" },
  { slug: "krasnodar", name: "Краснодар" },
];
```

- [ ] **Step 3: Write `lib/data/fixtures/categories.ts`**

```ts
import type { Category } from "../types";

export const categories: Category[] = [
  { slug: "products", name: "Продукты" },
  { slug: "coffee-tea", name: "Кофе и чай" },
  { slug: "drinks", name: "Напитки" },
  { slug: "alcohol", name: "Алкоголь" },
  { slug: "packaging", name: "Упаковка" },
  { slug: "equipment", name: "Оборудование" },
  { slug: "furniture", name: "Мебель" },
  { slug: "tableware", name: "Посуда" },
  { slug: "chemistry", name: "Химия" },
  { slug: "it-services", name: "IT и сервисы" },
  { slug: "education", name: "Обучение" },
  { slug: "logistics", name: "Логистика" },
  { slug: "other", name: "Другое" },
];
```

- [ ] **Step 4: Write `lib/data/fixtures/suppliers.ts`**

One fully worked entry, then eighteen total following the table below —
create each row as an object of the same shape, filling `about` with two
honest sentences expanding on the row's short description (no invented
certifications, awards, or numbers beyond what's in the table):

```ts
import type { Supplier } from "../types";

export const suppliers: Supplier[] = [
  {
    slug: "rostery-nord",
    name: "Rostery Nord",
    city: "moscow",
    regions: ["moscow", "spb"],
    categories: ["coffee-tea"],
    shortDescription:
      "Свежая обжарка кофе для HoReCa, еженедельные поставки по Москве.",
    about:
      "Обжариваем зерно партиями под конкретного клиента и отгружаем в течение недели после обжарки. Работаем с кофейнями и ресторанами, от одной точки до сети.",
    rating: 4.8,
    reviewCount: 142,
    status: "verified",
    conditions: {
      delivery: true,
      pickup: true,
      minOrder: 5000,
      worksWithLegalEntities: true,
      worksWithIndividualEntrepreneurs: true,
      deferredPayment: true,
      paymentMethods: ["Безналичный расчет", "Карта"],
    },
    contacts: {
      phone: "+7 495 000-11-22",
      website: "https://rostery-nord.example",
      telegram: "https://t.me/rosterynord",
    },
    foundedYear: 2016,
    keywords: ["кофе", "зерно", "обжарка", "бариста"],
    updatedAt: "2026-08-20",
  },
  // ...remaining 17 suppliers, one object per row below...
];
```

| slug | name | city | categories | status | rating | reviews | minOrder | delivery | pickup | legal | ip | deferred | founded | shortDescription |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| molterra | Молтерра | moscow | products | confirmed | 4.5 | 87 | 3000 | true | false | true | false | false | 2012 | Молочная продукция для кофеен и ресторанов с ежедневной доставкой. |
| upak-snab | УпакСнаб | spb | packaging | unverified | 4.1 | 23 | 2000 | true | true | true | true | false | — | Экологичная упаковка на вынос: стаканы, контейнеры, крафт-пакеты. |
| baristek | Баристек | moscow | equipment, coffee-tea | verified | 4.9 | 201 | — | true | true | true | false | true | 2009 | Кофемашины, кофемолки и сервис оборудования для кофеен. |
| chaynyy-dom-vostok | Чайный Дом Восток | kazan | coffee-tea, drinks | confirmed | 4.3 | 34 | 4000 | true | false | true | true | false | 2018 | Листовой чай, сиропы и основы для чайных напитков оптом. |
| barhat-mebel | Бархат Мебель | moscow | furniture | confirmed | 4.6 | 58 | — | true | true | true | false | true | 2014 | Мебель для кафе и ресторанов на заказ и со склада. |
| posuda-plus | Посуда+ | ekaterinburg | tableware | unverified | 3.9 | 12 | 1500 | true | true | true | true | false | — | Фарфоровая и стеклянная посуда для заведений общепита. |
| chisto-pro | ЧистоПро | moscow | chemistry | confirmed | 4.4 | 45 | 2500 | true | false | true | true | false | 2015 | Профессиональная химия для кухни и зала: от мытья посуды до дезинфекции. |
| kassa-oblako | Касса Облако | spb | it-services | verified | 4.7 | 76 | — | false | false | true | true | true | 2019 | Облачные кассы и учёт для кафе и ресторанов, подключение за день. |
| barmen-school | Школа Бармена | moscow | education | confirmed | 4.2 | 19 | — | false | false | true | false | false | 2017 | Обучение и аттестация барменов, бариста и линейного персонала. |
| log-express | ЛогЭкспресс | novosibirsk | logistics | unverified | 4.0 | 9 | — | true | false | true | true | false | — | Логистика и доставка сырья для кафе и ресторанов по Сибири. |
| vino-yug | Вино Юга | krasnodar | alcohol, drinks | verified | 4.6 | 63 | 10000 | true | true | true | false | true | 2011 | Оптовые поставки вина и крепкого алкоголя для баров и ресторанов. |
| myasnoy-dvor | Мясной Двор | moscow | products | confirmed | 4.5 | 98 | 5000 | true | true | true | true | false | 2013 | Мясо и полуфабрикаты для ресторанов с ежедневной свежей поставкой. |
| sirop-lab | Сироп Лаб | spb | coffee-tea, drinks | verified | 4.8 | 110 | 3000 | true | true | true | true | false | 2020 | Сиропы, топпинги и основы для кофеен и кофе-баров. |
| stol-i-stul | Стол и Стул | ekaterinburg | furniture | unverified | 3.8 | 7 | — | true | true | true | false | false | — | Столы, стулья и барные стойки для заведений под ключ. |
| pekarnya-opt | Пекарня Опт | moscow | products | confirmed | 4.4 | 71 | 2000 | true | true | true | true | false | 2016 | Замороженная выпечка и полуфабрикаты для кофеен и пекарен. |
| bar-oborud | БарОборудование | krasnodar | equipment | confirmed | 4.3 | 28 | — | true | true | true | false | true | 2012 | Барное оборудование и холодильные витрины для HoReCa. |
| eco-pack-nsk | ЭкоПак НСК | novosibirsk | packaging | verified | 4.7 | 54 | 1000 | true | false | true | true | false | 2019 | Биоразлагаемая упаковка для доставки еды и напитков. |

Notes for filling in the table rows:
- `regions` = `[city]` unless the row's category is one commonly shipped
  further (coffee-tea, packaging, alcohol) — for those, add one neighboring
  city slug from the cities fixture to `regions`.
- `paymentMethods` = `["Безналичный расчет", "Карта"]` for every row; add
  `"Наличные"` when `pickup` is `true`.
- `contacts.phone`/`website`/`telegram` = fabricate plausible
  `https://<slugified-name>.example` / `https://t.me/<slugified-name>`
  values consistently; omit `telegram` entirely (don't set the key) for
  exactly two rows (e.g. `posuda-plus`, `log-express`) so the "hide button
  if absent" behavior (spec §15) has real fixture cases to render against.
- `keywords` = 3–4 lowercase Russian words a buyer might type, derived from
  the category and short description (e.g. `posuda-plus` →
  `["посуда", "фарфор", "стекло", "сервировка"]`).
- `updatedAt` = ISO dates spread across the last 90 days from
  `2026-09-13`, not all identical, so the "Недавно обновленные" sort has
  something to sort.
- `foundedYear` — omit the key entirely (not `null`) for the four rows
  marked `—` above.
- `minOrder` — omit the key entirely (not `null`) for rows marked `—`.

- [ ] **Step 5: Write `lib/data/fixtures/offers.ts`**

```ts
import type { Offer } from "../types";

export const offers: Offer[] = [
  {
    id: "o1",
    supplierSlug: "rostery-nord",
    title: "Бесплатная доставка от 15 000 ₽",
    description: "Доставка кофе по Москве без наценки при заказе от 15 000 ₽.",
    city: "moscow",
    category: "coffee-tea",
    expiresAt: "2026-12-31",
  },
  {
    id: "o2",
    supplierSlug: "sirop-lab",
    title: "−15% новым клиентам",
    description: "Скидка на первый заказ сиропов и топпингов для новых кофеен.",
    city: "spb",
    category: "coffee-tea",
    expiresAt: "2026-11-30",
  },
  {
    id: "o3",
    supplierSlug: "vino-yug",
    title: "Специальные условия для баров",
    description: "Расширенная отсрочка платежа для баров при заказе от 10 000 ₽.",
    city: "krasnodar",
    category: "alcohol",
    expiresAt: "2026-10-31",
  },
  {
    id: "o4",
    supplierSlug: "eco-pack-nsk",
    title: "Бесплатный образец упаковки",
    description: "Пробный набор биоразлагаемой упаковки для новых клиентов.",
    city: "novosibirsk",
    category: "packaging",
    expiresAt: "2026-12-15",
  },
];
```

- [ ] **Step 6: Write the failing sanity test `lib/data/fixtures/fixtures.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { suppliers } from "./suppliers";
import { categories } from "./categories";
import { cities } from "./cities";
import { offers } from "./offers";

describe("fixtures", () => {
  it("has at least 15 suppliers with unique slugs", () => {
    expect(suppliers.length).toBeGreaterThanOrEqual(15);
    const slugs = new Set(suppliers.map((s) => s.slug));
    expect(slugs.size).toBe(suppliers.length);
  });

  it("only references categories that exist", () => {
    const validSlugs = new Set(categories.map((c) => c.slug));
    for (const supplier of suppliers) {
      for (const categorySlug of supplier.categories) {
        expect(validSlugs.has(categorySlug)).toBe(true);
      }
    }
  });

  it("only references cities that exist", () => {
    const validSlugs = new Set(cities.map((c) => c.slug));
    for (const supplier of suppliers) {
      expect(validSlugs.has(supplier.city)).toBe(true);
      for (const region of supplier.regions) {
        expect(validSlugs.has(region)).toBe(true);
      }
    }
  });

  it("only references suppliers that exist in offers", () => {
    const validSlugs = new Set(suppliers.map((s) => s.slug));
    for (const offer of offers) {
      expect(validSlugs.has(offer.supplierSlug)).toBe(true);
    }
  });
});
```

- [ ] **Step 7: Run the test to verify it fails first**

Run: `npm test -- fixtures.test.ts`
Expected: FAIL (files don't exist yet) — if the fixture files above were
already written in Steps 2–5, this will instead PASS immediately; that's
fine, the point is the assertions are real and specific.

- [ ] **Step 8: Run the full test suite to confirm it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add data types and fixture data"
```

---

### Task 4: Search scoring and data-access functions

**Files:**
- Create: `lib/data/scoring.ts`
- Create: `lib/data/suppliers.ts`
- Modify: `lib/data/types.ts`
- Test: `lib/data/scoring.test.ts`
- Test: `lib/data/suppliers.test.ts`

**Interfaces:**
- Consumes: `Supplier`, `Category`, `City` from Task 3; fixture arrays `suppliers`, `categories`, `cities`.
- Produces: `SupplierFilters`, `SearchResult` types; `scoreSupplier(supplier, query): number`; `getSuppliers(filters?): Promise<Supplier[]>`; `getSupplierBySlug(slug): Promise<Supplier | null>`; `getCategories(): Promise<Category[]>`; `searchSuppliers(query): Promise<SearchResult>`. Tasks 6, 8, 11, 13 call these exclusively — no page imports fixtures directly.

- [ ] **Step 1: Add filter/search types to `lib/data/types.ts`**

```ts
export interface SupplierFilters {
  city?: string;
  category?: string;
  delivery?: boolean;
  pickup?: boolean;
  confirmedOnly?: boolean;
  query?: string;
  sort?: "recommended" | "rating" | "new" | "updated";
}

export interface SearchResult {
  companies: Supplier[];
  categories: Category[];
  cities: City[];
}
```

- [ ] **Step 2: Write the failing test `lib/data/scoring.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { scoreSupplier } from "./scoring";
import { suppliers } from "./fixtures/suppliers";

const rosteryNord = suppliers.find((s) => s.slug === "rostery-nord")!;

describe("scoreSupplier", () => {
  it("scores an exact name match highest", () => {
    const exact = scoreSupplier(rosteryNord, "Rostery Nord");
    const prefix = scoreSupplier(rosteryNord, "Rostery");
    expect(exact).toBeGreaterThan(prefix);
  });

  it("scores a category match above a keyword substring match", () => {
    const categoryScore = scoreSupplier(rosteryNord, "coffee-tea");
    const substringScore = scoreSupplier(rosteryNord, "бариста");
    expect(categoryScore).toBeGreaterThan(substringScore);
  });

  it("returns 0 for no match", () => {
    expect(scoreSupplier(rosteryNord, "мебель")).toBe(0);
  });

  it("returns 0 for an empty query", () => {
    expect(scoreSupplier(rosteryNord, "")).toBe(0);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- scoring.test.ts`
Expected: FAIL with "Cannot find module './scoring'".

- [ ] **Step 4: Write `lib/data/scoring.ts`**

```ts
import type { Supplier } from "./types";

export function scoreSupplier(supplier: Supplier, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const name = supplier.name.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;

  const categoryHit = supplier.categories.some((c) => c.toLowerCase() === q);
  const cityHit = supplier.city.toLowerCase() === q;
  if (categoryHit || cityHit) return 60;

  const haystack = [name, supplier.city, ...supplier.categories, ...supplier.keywords]
    .join(" ")
    .toLowerCase();
  if (haystack.includes(q)) return 30;

  return 0;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- scoring.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the failing test `lib/data/suppliers.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { getSuppliers, getSupplierBySlug, getCategories, searchSuppliers } from "./suppliers";

describe("getSuppliers", () => {
  it("returns all suppliers with no filters", async () => {
    const result = await getSuppliers();
    expect(result.length).toBeGreaterThanOrEqual(15);
  });

  it("filters by city", async () => {
    const result = await getSuppliers({ city: "krasnodar" });
    expect(result.every((s) => s.city === "krasnodar" || s.regions.includes("krasnodar"))).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("filters by category", async () => {
    const result = await getSuppliers({ category: "coffee-tea" });
    expect(result.every((s) => s.categories.includes("coffee-tea"))).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("combines a text query with a city filter", async () => {
    const result = await getSuppliers({ city: "moscow", query: "кофе" });
    expect(result.every((s) => s.city === "moscow" || s.regions.includes("moscow"))).toBe(true);
  });

  it("returns an empty array when nothing matches", async () => {
    const result = await getSuppliers({ query: "несуществующий запрос xyz" });
    expect(result).toEqual([]);
  });

  it("sorts by rating when requested", async () => {
    const result = await getSuppliers({ sort: "rating" });
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].rating).toBeGreaterThanOrEqual(result[i].rating);
    }
  });
});

describe("getSupplierBySlug", () => {
  it("finds an existing supplier", async () => {
    const result = await getSupplierBySlug("rostery-nord");
    expect(result?.name).toBe("Rostery Nord");
  });

  it("returns null for an unknown slug", async () => {
    const result = await getSupplierBySlug("does-not-exist");
    expect(result).toBeNull();
  });
});

describe("getCategories", () => {
  it("returns the full category list", async () => {
    const result = await getCategories();
    expect(result.length).toBeGreaterThanOrEqual(10);
  });
});

describe("searchSuppliers", () => {
  it("groups matches into companies, categories, and cities", async () => {
    const result = await searchSuppliers("кофе");
    expect(result.companies.length).toBeGreaterThan(0);
    expect(result.categories.some((c) => c.slug === "coffee-tea")).toBe(true);
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `npm test -- suppliers.test.ts`
Expected: FAIL with "Cannot find module './suppliers'".

- [ ] **Step 8: Write `lib/data/suppliers.ts`**

```ts
import { suppliers as allSuppliers } from "./fixtures/suppliers";
import { categories as allCategories } from "./fixtures/categories";
import { cities as allCities } from "./fixtures/cities";
import { scoreSupplier } from "./scoring";
import type { Supplier, Category, SupplierFilters, SearchResult } from "./types";

export async function getSuppliers(filters: SupplierFilters = {}): Promise<Supplier[]> {
  let result = allSuppliers.slice();

  if (filters.city) {
    const city = filters.city;
    result = result.filter((s) => s.city === city || s.regions.includes(city));
  }
  if (filters.category) {
    result = result.filter((s) => s.categories.includes(filters.category!));
  }
  if (filters.delivery) {
    result = result.filter((s) => s.conditions.delivery);
  }
  if (filters.pickup) {
    result = result.filter((s) => s.conditions.pickup);
  }
  if (filters.confirmedOnly) {
    result = result.filter((s) => s.status !== "unverified");
  }
  if (filters.query) {
    result = result
      .map((s) => ({ supplier: s, score: scoreSupplier(s, filters.query!) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.supplier);
  }

  switch (filters.sort) {
    case "rating":
      result = result.slice().sort((a, b) => b.rating - a.rating);
      break;
    case "new":
      result = result.slice().sort((a, b) => (b.foundedYear ?? 0) - (a.foundedYear ?? 0));
      break;
    case "updated":
      result = result.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      break;
    default:
      break;
  }

  return result;
}

export async function getSupplierBySlug(slug: string): Promise<Supplier | null> {
  return allSuppliers.find((s) => s.slug === slug) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  return allCategories.slice();
}

export async function searchSuppliers(query: string): Promise<SearchResult> {
  const q = query.trim().toLowerCase();
  if (!q) return { companies: [], categories: [], cities: [] };

  const companies = allSuppliers
    .map((s) => ({ supplier: s, score: scoreSupplier(s, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => r.supplier);

  const categoryMatches = allCategories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5);
  const cityMatches = allCities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5);

  return { companies, categories: categoryMatches, cities: cityMatches };
}
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS (all suites, including Task 3's).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add search scoring and supplier data-access functions"
```

---

### Task 5: Site chrome — header, mobile tab bar, stub pages

**Files:**
- Create: `components/site-header.tsx`
- Create: `components/mobile-tab-bar.tsx`
- Create: `components/stub-page.tsx`
- Create: `app/map/page.tsx`
- Create: `app/offers/page.tsx`
- Create: `app/suppliers-portal/page.tsx`
- Create: `app/profile/page.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `<SiteHeader />`, `<MobileTabBar />` rendered in the root layout on every route; `<StubPage title="..." />` for the four not-yet-built routes.

- [ ] **Step 1: Write `components/site-header.tsx`**

```tsx
import Link from "next/link";

const navItems = [
  { href: "/", label: "Главная" },
  { href: "/suppliers", label: "Поставщики" },
  { href: "/map", label: "Карта" },
  { href: "/offers", label: "Предложения" },
  { href: "/suppliers-portal", label: "Для поставщиков" },
];

export function SiteHeader() {
  return (
    <header className="hidden md:flex items-center justify-between border-b border-[var(--color-line)] px-8 py-4">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Грядка
      </Link>
      <nav className="flex items-center gap-6 text-sm text-[var(--color-ink-soft)]">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="hover:text-[var(--color-ink)]">
            {item.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/profile"
        className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-4 py-2 text-sm"
      >
        Профиль
      </Link>
    </header>
  );
}
```

- [ ] **Step 2: Write `components/mobile-tab-bar.tsx`**

```tsx
import Link from "next/link";

const tabs = [
  { href: "/", label: "Главная" },
  { href: "/suppliers", label: "Поставщики" },
  { href: "/map", label: "Карта" },
  { href: "/offers", label: "Предложения" },
  { href: "/profile", label: "Профиль" },
];

export function MobileTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex justify-between border-t border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-2 md:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="flex-1 text-center text-xs text-[var(--color-ink-soft)]"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Write `components/stub-page.tsx`**

```tsx
export function StubPage({ title }: { title: string }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-[var(--color-ink-soft)]">Раздел в разработке.</p>
    </main>
  );
}
```

- [ ] **Step 4: Write the four stub page routes**

`app/map/page.tsx`:
```tsx
import { StubPage } from "@/components/stub-page";

export default function MapPage() {
  return <StubPage title="Карта" />;
}
```

`app/offers/page.tsx`:
```tsx
import { StubPage } from "@/components/stub-page";

export default function OffersPage() {
  return <StubPage title="Предложения" />;
}
```

`app/suppliers-portal/page.tsx`:
```tsx
import { StubPage } from "@/components/stub-page";

export default function SuppliersPortalPage() {
  return <StubPage title="Для поставщиков" />;
}
```

`app/profile/page.tsx`:
```tsx
import { StubPage } from "@/components/stub-page";

export default function ProfilePage() {
  return <StubPage title="Профиль" />;
}
```

- [ ] **Step 5: Wire the header and tab bar into `app/layout.tsx`**

```tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { manrope } from "@/lib/fonts";
import { SiteHeader } from "@/components/site-header";
import { MobileTabBar } from "@/components/mobile-tab-bar";

export const metadata: Metadata = {
  title: "Грядка",
  description: "Платформа поставщиков для HoReCa",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="font-sans pb-14 md:pb-0">
        <SiteHeader />
        {children}
        <MobileTabBar />
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: succeeds; visiting `/map`, `/offers`, `/suppliers-portal`, `/profile` in `npm run dev` shows the header/tab bar plus the stub message.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add site header, mobile tab bar, and stub routes"
```

---

### Task 6: Search bar with autocomplete

**Files:**
- Create: `components/search-bar.tsx`

**Interfaces:**
- Consumes: `searchSuppliers(query)` from Task 4.
- Produces: `<SearchBar />` — a client component used by both Task 8 (Главная) and Task 11 (catalog). On submit (button click or Enter) it navigates to `/suppliers?q=<value>`.

- [ ] **Step 1: Write `components/search-bar.tsx`**

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchSuppliers } from "@/lib/data/suppliers";
import type { SearchResult } from "@/lib/data/types";

const emptyResult: SearchResult = { companies: [], categories: [], cities: [] };

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult>(emptyResult);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!value.trim()) {
      setResults(emptyResult);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(() => {
        searchSuppliers(value).then(setResults);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [value]);

  function submit(query: string) {
    setOpen(false);
    router.push(`/suppliers?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="relative w-full max-w-2xl">
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && submit(value)}
          placeholder="Найти поставщика, категорию или услугу"
          className="flex-1 bg-transparent text-base outline-none"
        />
        <button
          onClick={() => submit(value)}
          className="rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 py-2 text-sm text-white"
        >
          Найти
        </button>
      </div>

      {open && value.trim() && (
        <div className="absolute z-20 mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-none">
          {results.companies.length === 0 &&
          results.categories.length === 0 &&
          results.cities.length === 0 ? (
            <p className="px-2 py-1 text-sm text-[var(--color-ink-soft)]">Ничего не найдено</p>
          ) : (
            <>
              {results.companies.length > 0 && (
                <SuggestionGroup label="Компании">
                  {results.companies.map((s) => (
                    <SuggestionItem key={s.slug} onClick={() => router.push(`/supplier/${s.slug}`)}>
                      {s.name}
                    </SuggestionItem>
                  ))}
                </SuggestionGroup>
              )}
              {results.categories.length > 0 && (
                <SuggestionGroup label="Категории">
                  {results.categories.map((c) => (
                    <SuggestionItem key={c.slug} onClick={() => submit(c.name)}>
                      {c.name}
                    </SuggestionItem>
                  ))}
                </SuggestionGroup>
              )}
              {results.cities.length > 0 && (
                <SuggestionGroup label="Города">
                  {results.cities.map((c) => (
                    <SuggestionItem key={c.slug} onClick={() => submit(c.name)}>
                      {c.name}
                    </SuggestionItem>
                  ))}
                </SuggestionGroup>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-2 pb-1 text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</p>
      {children}
    </div>
  );
}

function SuggestionItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block w-full rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm hover:bg-[var(--color-paper)]"
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: succeeds (this component isn't mounted anywhere yet — Task 8 mounts it on Главная).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add search bar with autocomplete"
```

---

### Task 7: Card components

**Files:**
- Create: `components/supplier-logo.tsx`
- Create: `components/category-card.tsx`
- Create: `components/supplier-card.tsx`
- Create: `components/offer-teaser-card.tsx`

**Interfaces:**
- Consumes: `Supplier`, `Category`, `Offer` types from Task 3.
- Produces: `<SupplierLogo name />`, `<CategoryCard category />`, `<SupplierCard supplier />`, `<OfferTeaserCard offer supplierName />` — Tasks 8, 11, 13 render these.

- [ ] **Step 1: Write `components/supplier-logo.tsx`**

Renders the supplier's initials in a small colored square instead of a
placeholder photo — there is no real product photography for fixture
companies, and fabricated stock imagery would violate the "don't invent
data" principle. Real logos/photos arrive with the backend sub-project.

```tsx
const palette = ["#B5451F", "#2F5D50", "#3B4B6B", "#7A5C3E", "#5B6168"];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function SupplierLogo({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-sm font-semibold text-white"
      style={{ backgroundColor: colorFor(name) }}
    >
      {initials}
    </div>
  );
}
```

- [ ] **Step 2: Write `components/category-card.tsx`**

```tsx
import Link from "next/link";
import type { Category } from "@/lib/data/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/suppliers?category=${category.slug}`}
      className="rounded-[var(--radius-md)] border border-[var(--color-line)] px-4 py-6 text-center text-sm font-medium hover:border-[var(--color-ink)]"
    >
      {category.name}
    </Link>
  );
}
```

- [ ] **Step 3: Write `components/supplier-card.tsx`**

```tsx
import Link from "next/link";
import { SupplierLogo } from "./supplier-logo";
import type { Supplier } from "@/lib/data/types";
import { cities } from "@/lib/data/fixtures/cities";
import { categories } from "@/lib/data/fixtures/categories";

const statusLabel: Record<Supplier["status"], string | null> = {
  unverified: null,
  confirmed: "Профиль подтвержден",
  verified: "Проверен Грядкой",
};

export function SupplierCard({ supplier }: { supplier: Supplier }) {
  const cityName = cities.find((c) => c.slug === supplier.city)?.name ?? supplier.city;
  const categoryNames = supplier.categories
    .map((slug) => categories.find((c) => c.slug === slug)?.name)
    .filter(Boolean);
  const status = statusLabel[supplier.status];

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] p-5">
      <div className="flex items-start gap-3">
        <SupplierLogo name={supplier.name} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{supplier.name}</h3>
          <p className="text-sm text-[var(--color-ink-soft)]">{cityName}</p>
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-[var(--color-ink-soft)]">{supplier.shortDescription}</p>

      <div className="flex flex-wrap gap-2 text-xs text-[var(--color-ink-soft)]">
        {categoryNames.map((name) => (
          <span key={name} className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-2 py-1">
            {name}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-sm">
          ★ {supplier.rating.toFixed(1)}{" "}
          <span className="text-[var(--color-ink-soft)]">({supplier.reviewCount})</span>
          {status && <span className="ml-2 text-[var(--color-ink-soft)]">· {status}</span>}
        </div>
        <Link
          href={`/supplier/${supplier.slug}`}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-1.5 text-sm"
        >
          Открыть
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `components/offer-teaser-card.tsx`**

```tsx
import Link from "next/link";
import type { Offer } from "@/lib/data/types";

export function OfferTeaserCard({ offer, supplierName }: { offer: Offer; supplierName: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] p-5">
      <p className="text-sm text-[var(--color-ink-soft)]">{supplierName}</p>
      <h3 className="font-semibold">{offer.title}</h3>
      <p className="line-clamp-2 text-sm text-[var(--color-ink-soft)]">{offer.description}</p>
      <Link
        href={`/supplier/${offer.supplierSlug}`}
        className="mt-1 text-sm font-medium text-[var(--color-accent)]"
      >
        Подробнее
      </Link>
    </div>
  );
}
```

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: succeeds (components not yet mounted on a page).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add category, supplier, and offer card components"
```

---

### Task 8: Главная page

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getSuppliers`, `getCategories` (Task 4); `SearchBar` (Task 6); `CategoryCard`, `SupplierCard`, `OfferTeaserCard` (Task 7); `offers` fixture (Task 3).

- [ ] **Step 1: Write `app/page.tsx`**

```tsx
import { getSuppliers, getCategories } from "@/lib/data/suppliers";
import { offers } from "@/lib/data/fixtures/offers";
import { SearchBar } from "@/components/search-bar";
import { CategoryCard } from "@/components/category-card";
import { SupplierCard } from "@/components/supplier-card";
import { OfferTeaserCard } from "@/components/offer-teaser-card";

export default async function HomePage() {
  const [categories, popularSuppliers] = await Promise.all([
    getCategories(),
    getSuppliers({ sort: "rating" }),
  ]);
  const topSuppliers = popularSuppliers.slice(0, 6);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-12 md:py-20">
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-6xl">
          Найдите поставщика для своего бизнеса
        </h1>
        <p className="max-w-xl text-[var(--color-ink-soft)]">
          Поставщики для кофеен, ресторанов, баров и других заведений HoReCa — в одном месте.
        </p>
        <SearchBar />
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold">Категории</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold">Популярные поставщики</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topSuppliers.map((supplier) => (
            <SupplierCard key={supplier.slug} supplier={supplier} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold">Акции и спецпредложения</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {offers.map((offer) => {
            const supplier = popularSuppliers.find((s) => s.slug === offer.supplierSlug);
            return (
              <OfferTeaserCard key={offer.id} offer={offer} supplierName={supplier?.name ?? ""} />
            );
          })}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: succeeds; `npm run dev` shows a working Главная with hero search, category grid, supplier cards, and offer teasers.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: assemble Главная page"
```

---

### Task 9: «Стать поставщиком» onboarding form

**Files:**
- Create: `components/become-supplier-form.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `<BecomeSupplierForm />`, a self-contained client component with local validation and success state — no network call.

- [ ] **Step 1: Write `components/become-supplier-form.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { categories } from "@/lib/data/fixtures/categories";
import { cities } from "@/lib/data/fixtures/cities";

const fields = [
  "companyName",
  "contactName",
  "phone",
  "email",
  "website",
  "telegram",
  "city",
  "regions",
  "description",
  "address",
] as const;

type FieldName = (typeof fields)[number];
type FormState = Record<FieldName, string> & { categorySlugs: string[] };

const initialState: FormState = {
  companyName: "",
  contactName: "",
  phone: "",
  email: "",
  website: "",
  telegram: "",
  city: "",
  regions: "",
  description: "",
  address: "",
  categorySlugs: [],
};

const requiredFields: FieldName[] = ["companyName", "contactName", "phone", "email", "city"];

export function BecomeSupplierForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const missing = requiredFields.filter((field) => !form[field].trim());
    if (missing.length > 0 || form.categorySlugs.length === 0) {
      setError("Заполните обязательные поля и выберите хотя бы одну категорию.");
      return;
    }
    setError(null);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-6 text-center">
        <p className="font-medium">Заявка отправлена. После проверки профиль будет опубликован.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--color-line)] p-6">
      <TextField label="Название компании *" value={form.companyName} onChange={(v) => update("companyName", v)} />
      <TextField label="Имя контактного лица *" value={form.contactName} onChange={(v) => update("contactName", v)} />
      <TextField label="Телефон *" value={form.phone} onChange={(v) => update("phone", v)} />
      <TextField label="Email *" value={form.email} onChange={(v) => update("email", v)} />
      <TextField label="Сайт" value={form.website} onChange={(v) => update("website", v)} />
      <TextField label="Telegram" value={form.telegram} onChange={(v) => update("telegram", v)} />

      <label className="flex flex-col gap-1 text-sm">
        Город *
        <select
          value={form.city}
          onChange={(e) => update("city", e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2"
        >
          <option value="">Выберите город</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm">Категории *</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = form.categorySlugs.includes(category.slug);
            return (
              <button
                type="button"
                key={category.slug}
                onClick={() =>
                  update(
                    "categorySlugs",
                    active
                      ? form.categorySlugs.filter((slug) => slug !== category.slug)
                      : [...form.categorySlugs, category.slug],
                  )
                }
                className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm ${
                  active ? "border-[var(--color-ink)]" : "border-[var(--color-line)]"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <TextField label="Регионы доставки" value={form.regions} onChange={(v) => update("regions", v)} />
      <TextField label="Краткое описание" value={form.description} onChange={(v) => update("description", v)} multiline />
      <TextField label="Адрес" value={form.address} onChange={(v) => update("address", v)} />

      {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}

      <button
        type="submit"
        className="mt-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 py-2 text-sm text-white"
      >
        Отправить заявку
      </button>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2"
          rows={3}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2"
        />
      )}
    </label>
  );
}
```

- [ ] **Step 2: Add the section to `app/page.tsx`**

Add this import:

```tsx
import { BecomeSupplierForm } from "@/components/become-supplier-form";
```

Add this section right before the closing `</main>`:

```tsx
      <section className="flex flex-col items-center gap-6 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-8 text-center">
        <h2 className="text-2xl font-semibold">Стать поставщиком</h2>
        <p className="max-w-xl text-[var(--color-ink-soft)]">
          Разместите компанию в Грядке и получайте заявки от заведений HoReCa.
        </p>
        <div className="w-full max-w-xl text-left">
          <BecomeSupplierForm />
        </div>
      </section>
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: succeeds; manually submitting the form with missing required fields shows the error, and a full submission shows the success message.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add become-a-supplier onboarding form to Главная"
```

---

### Task 10: Filter panel and sort dropdown

**Files:**
- Create: `components/filter-panel.tsx`
- Create: `components/sort-dropdown.tsx`

**Interfaces:**
- Produces: `<FilterPanel />`, `<SortDropdown />` — both client components that read/write the URL's search params (`city`, `category`, `delivery`, `pickup`, `confirmed`, `sort`) via `useRouter`/`useSearchParams`, so filters are deep-linkable per spec §10. Task 11 mounts both.

- [ ] **Step 1: Write `components/filter-panel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "@/lib/data/fixtures/categories";
import { cities } from "@/lib/data/fixtures/cities";

const booleanFilters = [
  { key: "delivery", label: "Доставка" },
  { key: "pickup", label: "Самовывоз" },
  { key: "confirmed", label: "Подтвержденный профиль" },
] as const;

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMore, setShowMore] = useState(false);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/suppliers?${params.toString()}`);
  }

  function toggleBoolean(key: string) {
    setParam(key, searchParams.get(key) === "1" ? null : "1");
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <label className="flex flex-col gap-1">
        Город
        <select
          value={searchParams.get("city") ?? ""}
          onChange={(e) => setParam("city", e.target.value || null)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2"
        >
          <option value="">Все города</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        Категория
        <select
          value={searchParams.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value || null)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2"
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {booleanFilters.slice(0, 1).map((filter) => (
        <BooleanCheckbox
          key={filter.key}
          label={filter.label}
          checked={searchParams.get(filter.key) === "1"}
          onChange={() => toggleBoolean(filter.key)}
        />
      ))}

      {showMore ? (
        booleanFilters.slice(1).map((filter) => (
          <BooleanCheckbox
            key={filter.key}
            label={filter.label}
            checked={searchParams.get(filter.key) === "1"}
            onChange={() => toggleBoolean(filter.key)}
          />
        ))
      ) : (
        <button type="button" onClick={() => setShowMore(true)} className="text-left text-[var(--color-accent)]">
          Ещё фильтры
        </button>
      )}
    </div>
  );
}

function BooleanCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
```

- [ ] **Step 2: Write `components/sort-dropdown.tsx`**

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

const options = [
  { value: "recommended", label: "Рекомендуемые" },
  { value: "rating", label: "По рейтингу" },
  { value: "new", label: "Сначала новые" },
  { value: "updated", label: "Недавно обновленные" },
];

export function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "recommended") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`/suppliers?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      Сортировка
      <select
        value={searchParams.get("sort") ?? "recommended"}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: succeeds (not yet mounted on a page).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add filter panel and sort dropdown"
```

---

### Task 11: `/suppliers` catalog page

**Files:**
- Create: `app/suppliers/page.tsx`

**Interfaces:**
- Consumes: `getSuppliers` (Task 4); `SearchBar` (Task 6); `SupplierCard` (Task 7); `FilterPanel`, `SortDropdown` (Task 10).

- [ ] **Step 1: Write `app/suppliers/page.tsx`**

```tsx
import Link from "next/link";
import { getSuppliers } from "@/lib/data/suppliers";
import { SearchBar } from "@/components/search-bar";
import { SupplierCard } from "@/components/supplier-card";
import { FilterPanel } from "@/components/filter-panel";
import { SortDropdown } from "@/components/sort-dropdown";
import type { SupplierFilters } from "@/lib/data/types";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters: SupplierFilters = {
    city: readParam(params, "city"),
    category: readParam(params, "category"),
    delivery: readParam(params, "delivery") === "1",
    pickup: readParam(params, "pickup") === "1",
    confirmedOnly: readParam(params, "confirmed") === "1",
    query: readParam(params, "q"),
    sort: (readParam(params, "sort") as SupplierFilters["sort"]) ?? "recommended",
  };

  const suppliers = await getSuppliers(filters);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <SearchBar initialQuery={filters.query} />

      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <FilterPanel />
        </aside>

        <div className="flex flex-1 flex-col gap-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-ink-soft)]">Найдено: {suppliers.length}</p>
            <SortDropdown />
          </div>

          {suppliers.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-8 text-center">
              <p className="mb-2 font-medium">Ничего не найдено</p>
              <p className="text-sm text-[var(--color-ink-soft)]">
                Не нашли поставщика?{" "}
                <Link href="/suppliers-portal" className="text-[var(--color-accent)]">
                  Добавьте его
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((supplier) => (
                <SupplierCard key={supplier.slug} supplier={supplier} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: succeeds; `npm run dev` on `/suppliers`, `/suppliers?category=coffee-tea`, and `/suppliers?city=moscow` each show correctly filtered results, and filter/sort controls update the URL.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: assemble /suppliers catalog page"
```

---

### Task 12: Share button

**Files:**
- Create: `components/share-button.tsx`

**Interfaces:**
- Produces: `<ShareButton title url />` — client component using the Web Share API where available, falling back to clipboard copy with a toast.

- [ ] **Step 1: Write `components/share-button.tsx`**

```tsx
"use client";

import { useState } from "react";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-1.5 text-sm"
    >
      {copied ? "Ссылка скопирована" : "Поделиться"}
    </button>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add share button with Web Share API and clipboard fallback"
```

---

### Task 13: `/supplier/[slug]` profile page

**Files:**
- Create: `app/supplier/[slug]/page.tsx`
- Create: `app/supplier/[slug]/not-found.tsx`

**Interfaces:**
- Consumes: `getSupplierBySlug` (Task 4); `SupplierLogo` (Task 7); `ShareButton` (Task 12); `offers`, `cities`, `categories` fixtures (Task 3).

- [ ] **Step 1: Write `app/supplier/[slug]/not-found.tsx`**

```tsx
export default function SupplierNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-2xl font-semibold">Поставщик не найден</h1>
    </main>
  );
}
```

- [ ] **Step 2: Write `app/supplier/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getSupplierBySlug } from "@/lib/data/suppliers";
import { offers } from "@/lib/data/fixtures/offers";
import { cities } from "@/lib/data/fixtures/cities";
import { categories } from "@/lib/data/fixtures/categories";
import { SupplierLogo } from "@/components/supplier-logo";
import { ShareButton } from "@/components/share-button";

const statusLabel: Record<string, string | null> = {
  unverified: null,
  confirmed: "Профиль подтвержден",
  verified: "Проверен Грядкой",
};

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
              className="rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 py-2 text-sm text-white"
            >
              Перейти на сайт
            </a>
          )}
          {supplier.contacts.phone && (
            <a
              href={`tel:${supplier.contacts.phone}`}
              className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-4 py-2 text-sm"
            >
              Позвонить
            </a>
          )}
          {supplier.contacts.telegram && (
            <a
              href={supplier.contacts.telegram}
              className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-4 py-2 text-sm"
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
              className="rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-1.5 text-sm"
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
```

Note on "Перейти на сайт": this pass links to `/api/redirect?to=...` as the
tracking-redirect seam the spec (§14) requires, but that endpoint itself
belongs to the Backend Foundation sub-project (it needs a place to record
clicks). Leave the link pointed there — Task 14's QA pass confirms it 404s
gracefully for now — rather than linking `website` directly, so the URL
shape doesn't change again once tracking exists.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: succeeds; `npm run dev` on `/supplier/rostery-nord` shows the full
profile; `/supplier/does-not-exist` shows the not-found page; a supplier
fixture missing `telegram` (e.g. `/supplier/posuda-plus`) correctly omits
the Telegram button.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: assemble supplier profile page"
```

---

### Task 14: Responsive QA pass

**Files:**
- Modify: any component/page file where an issue is found during this pass.

**Interfaces:**
- Consumes: the entire app built in Tasks 1–13.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Check each page at 360px width**

Visit `/`, `/suppliers`, `/suppliers?category=coffee-tea`,
`/supplier/rostery-nord` with the browser viewport (or devtools device
toolbar) set to 360px wide. Confirm: no text overflows its container, no
image/card overlaps neighboring content, the hero heading wraps instead of
truncating awkwardly, the mobile tab bar doesn't cover page content (check
the `pb-14` on `<body>` from Task 5 is enough), and the header nav is
hidden in favor of the tab bar.

- [ ] **Step 3: Repeat at 390px, 768px, 1024px, and 1440px**

Same four pages, same checks, at each width. At 768px confirm the
`FilterPanel`/results layout switches from stacked to side-by-side per the
`md:flex-row` breakpoint in Task 11.

- [ ] **Step 4: Fix anything found**

For each issue, edit the offending file directly (adjust Tailwind
breakpoint classes, `line-clamp`, `min-w-0`/`truncate` usage, or flex/grid
wrapping) and re-check that specific width. Do not introduce new
components in this task — every fix should be a small edit to an existing
file from Tasks 1–13.

- [ ] **Step 5: Run the full test suite one more time**

Run: `npm test`
Expected: PASS (unchanged — this task doesn't touch `lib/data`).

- [ ] **Step 6: Final build check**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix: responsive polish across 360–1440px breakpoints"
```
