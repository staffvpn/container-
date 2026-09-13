# Грядка — Public Site, Pass 1 (Главная / Поставщики / карточка поставщика)

**Date:** 2026-09-13
**Status:** approved for planning

## Context

Грядка is a B2B directory for HoReCa businesses to find and compare suppliers
(cafés, restaurants, bars, hotels, catering → coffee roasters, distributors,
equipment, packaging, furniture, IT/services). It is explicitly **not** a
storefront or product catalog — no per-SKU pricing, no cart, no checkout.
Value proposition: find the right supplier in minutes instead of checking ten
sites.

The full product brief (see chat history 2026-09-13) covers four largely
independent subsystems:

1. **Backend Foundation** — data model, auth, RLS, moderation state machine,
   click-tracking events.
2. **Public site** — Главная, Поставщики, Карта, Предложения, страница
   поставщика, поиск. *(this document)*
3. **Личный кабинет поставщика** — onboarding, profile/offers/news editing,
   stats.
4. **Админ-панель `/admin`** — dashboard, moderation queues, users, categories/
   cities, audit log, roles.

Each sub-project gets its own design → plan → implementation cycle. This spec
covers the first increment of #2: enough of the public site to prove out the
visual language and interaction model — **Главная**, the **Поставщики**
catalog, and an individual **supplier profile page** — running entirely on
realistic hardcoded fixture data. Карта, Предложения, «Для поставщиков», and
«Профиль» get placeholder stub pages so the navigation is complete; their real
design is a later increment. No backend, no auth, no real search index — those
belong to sub-project 1.

## Goals

- Establish the typography-first visual system the rest of the product will
  reuse: type scale, spacing, color, borders/radii, card and button language.
- Ship three fully real pages (not wireframes): Главная, /suppliers,
  /supplier/[slug].
- Working search: type-ahead suggestions + real relevance matching against
  fixture data (name / category / city / keyword), not a cosmetic input.
- A data-access layer (`lib/data/`) shaped exactly like the future Supabase
  queries, so sub-project 1 swaps implementations without touching any page
  or component.
- Fully responsive: no overlap/collision between text and images at any
  common breakpoint (360px through wide desktop).

## Non-goals (explicitly out of scope for this pass)

- Карта, Предложения (full pages), Личный кабинет, Админ-панель.
- Real authentication (Telegram/phone login), reviews submission, promo
  codes, favorites persistence, click-tracking redirects — UI may hint at
  these (e.g. a disabled/"soon" affordance) but nothing is wired to a backend.
- Real fonts — a placeholder pairing is used, isolated behind one file so
  swapping later is a one-file change.
- SEO metadata generation beyond basic per-page `<title>`/`<meta description>`
  (full OG/canonical/sitemap work belongs with the backend-integrated build).

## Data layer contract

```
lib/data/
  types.ts        // Supplier, Category, City, Offer, Review shapes —
                   // written to match the eventual DB rows, not the UI
  fixtures/
    suppliers.ts   // ~20 suppliers across categories/cities
    categories.ts  // ~12 categories per section 6 of the brief
    cities.ts      // Москва, СПб, + a few others
  suppliers.ts     // exported functions pages call:
                   //   getSuppliers(filters?): Promise<Supplier[]>
                   //   getSupplierBySlug(slug): Promise<Supplier | null>
                   //   searchSuppliers(query): Promise<SearchResult[]>
                   //   getCategories(): Promise<Category[]>
```

Every exported function is `async` and returns the same shape a Supabase
query will return later. Fixture data lives under `fixtures/`; the functions
in `suppliers.ts` are the primary files sub-project 1 needs to rewrite.
`components/filter-panel.tsx` and `components/become-supplier-form.tsx` also
read the `cities`/`categories` fixtures directly (for their city/category
pickers), and, being client components, will need restructuring — receiving
this data as props from a server parent — rather than a drop-in swap when
the real backend lands.

`Supplier` fields mirror brief sections 10–19: name, slug, logoUrl, city,
categories[], shortDescription, rating, reviewCount, status
(`unverified | confirmed | verified`), conditions (delivery, pickup,
minOrder, worksWithLegalEntities, worksWithIndividualEntrepreneurs,
deferredPayment, paymentMethods[]), contacts (phone, website, telegram),
foundedYear?, about, regions[]. Optional fields that have no value are
omitted, not set to placeholder text — pages must hide the row entirely
(brief section 18/21).

## Routes

| Route | Content |
|---|---|
| `/` | Главная: hero + search, category grid, popular suppliers, offers teaser (fixture offers), «Стать поставщиком» CTA + full form |
| `/suppliers` | search bar, filter panel, sort dropdown, supplier card grid, empty state, «Не нашли поставщика? Добавьте его» |
| `/suppliers?category=coffee` / `?city=moscow` | same page, pre-applied filter from deep link |
| `/supplier/[slug]` | full profile per brief sections 13–20 (minus reviews-writing and offers CTA back-end wiring) |
| `/map`, `/offers`, `/suppliers-portal`, `/profile` | stub pages: page shell + "Раздел в разработке" — real nav entries, no 404s |

## Design system

- **Type**: single grotesk family (Manrope via `next/font/google`) at 3–4
  weights, no second display face. Isolated in `lib/fonts.ts` so swapping to
  the real brand font later touches one file. Confident hero size
  (40–56px), restrained body (14–16px), a consistent modular scale between.
- **Color**: near-black text on off-white background, one accent color used
  only for primary CTAs and active/selected states — not decoratively.
  Status text (Подтвержден / Проверен Грядкой) uses a quiet icon + text
  treatment, never a loud badge.
- **Spacing**: 8pt scale throughout, generous section padding — "much air"
  per the brief.
- **Surfaces**: hairline 1px borders instead of drop shadows for card
  separation; radii in the 8–12px range; no gradients, no 3D, no
  illustration filler.
- **Cards**: one visual weight for supplier cards site-wide (home, catalog,
  map-adjacent later) — logo, name, city, categories, rating, one condition
  line, single primary CTA ("Открыть"), at most one secondary action shown.

## Key components

- `SiteHeader` — desktop nav (Главная/Поставщики/Карта/Предложения/Для
  поставщиков/Профиль) + `MobileTabBar` (bottom nav, brief section 56).
- `SearchBar` — controlled input, debounced, dropdown grouped into
  Компании / Категории / Города / Популярные запросы (brief section 27);
  Enter and the «Найти» button both submit to `/suppliers?q=...`.
- `CategoryCard`, `SupplierCard`, `OfferTeaserCard`.
- `FilterPanel` — primary filters visible (город, категория, доставка,
  самовывоч, подтвержденный профиль); secondary filters behind
  «Ещё фильтры» disclosure (brief section 10's "not all filters at once").
- `SortDropdown` — Рекомендуемые (default) / По рейтингу / Сначала новые /
  Недавно обновленные.
- `BecomeSupplierForm` — all 13 fields from brief section 9, client-side
  validated, ends in a local success state ("Заявка отправлена…"), no
  network call.
- `ShareButton` — Web Share API with copy-link fallback + toast (brief
  section 29), included on the supplier profile page.

## Search & relevance behavior

`searchSuppliers(query)` scores each fixture supplier: exact name match >
name prefix > category/city exact > substring anywhere in
name/category/city/keywords. The type-ahead dropdown shows top matches per
group (companies/categories/cities) plus 1–2 canned "popular query" strings
per brief section 27. `/suppliers` page applies the same scoring function
when `?q=` is present, combined with active filter state.

## Testing

- Unit tests for `lib/data/suppliers.ts` matching/scoring logic (the one
  piece of real logic in this pass) — exact/prefix/substring cases, filter
  combination, empty results.
- Manual responsive pass at common breakpoints (360/390/768/1024/1440px)
  confirming no text/image overlap, since this sub-project's deliverable is
  fundamentally the visual system.

## Open items for later increments

- Карта, Предложения full pages (sub-project 2, pass 2).
- Backend Foundation (auth, RLS, real persistence, tracking) — sub-project 1.
- Личный кабинет поставщика — sub-project 3.
- Admin panel — sub-project 4.
- Real brand fonts — swap into `lib/fonts.ts` when received.
- `components/filter-panel.tsx` and `components/become-supplier-form.tsx`
  read the `cities`/`categories` fixtures directly instead of going through
  `lib/data/suppliers.ts`; as client components they'll need to be
  restructured to receive this data as props from a server parent when the
  real backend lands, rather than a drop-in function swap.
