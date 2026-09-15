# Грядка Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public site's fixture-data layer with a real Supabase backend (schema + RLS + Telegram auth + Edge Functions), and wire the existing/new forms (Стать поставщиком, Добавить поставщика, отзывы, сообщить об ошибке) and analytics tracking to real writes.

**Architecture:** Reads go straight through PostgREST with RLS scoping anon/authenticated to `published` rows. Every write except `analytics_events` goes through a dedicated Edge Function using the service role, so RLS on those tables stays default-deny for `anon`/`authenticated`. `lib/data/suppliers.ts`'s exported function signatures do not change — only their internals move from array filtering to Supabase queries.

**Tech Stack:** Next.js 15 App Router, TypeScript, `@supabase/supabase-js`, `@supabase/ssr`, Supabase Postgres 17 + Edge Functions (Deno) + Auth, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-15-backend-foundation-design.md`

**Supabase project:** id/ref `dojevarrfczgmyxzpfbx`, org `nichegotakova` (`elbjuqrqrvnidjqnraqd`), region `eu-west-1`. This project previously existed as `ncht` (unused, restored from pause for this purpose) — its schema is wiped in Task 1 before building the real one. All schema/RLS/Edge-Function work uses the `mcp__supabase__*` tools (`apply_migration`, `execute_sql`, `deploy_edge_function`) directly against this project id — there is no local Supabase CLI in this environment.

## Global Constraints

- Every table has RLS enabled. No table gets a client-facing `INSERT`/`UPDATE`/`DELETE` policy except `analytics_events` (`INSERT`-only, `anon`+`authenticated`).
- `profiles.role` is never set from client-supplied data — only by server-side code (the `handle_new_user` trigger, defaulting to `'user'`) or later by an admin action (sub-project 4, not built here). This is the exact fix for a real privilege-escalation bug found on FASDELY (`raw_user_meta_data` is client-controlled; `raw_app_meta_data` is not).
- `lib/data/suppliers.ts`'s exported function names, parameters, and return types are unchanged: `getSuppliers(filters): Promise<Supplier[]>`, `getSupplierBySlug(slug): Promise<Supplier | null>`, `getCategories(): Promise<Category[]>`, `getCities(): Promise<City[]>`, `getOffers(supplierSlug?): Promise<Offer[]>`, `searchSuppliers(query): Promise<SearchResult>`.
- Every Edge Function includes CORS headers (`OPTIONS` preflight branch) — a real bug on FASDELY was an Edge Function with none, invisible until a browser actually called it.
- Site language stays Russian in every user-facing string.

---

### Task 1: Base schema — profiles, cities, categories, audit_log

**Files:**
- No repo files — this is a Supabase migration applied via `mcp__supabase__apply_migration` with `project_id: "dojevarrfczgmyxzpfbx"`.

**Interfaces:**
- Produces: tables `profiles(id, role, telegram_user_id, telegram_username, display_name, avatar_url, created_at)`, `cities(id, slug, name, lat, lng)`, `categories(id, slug, name, sort_order)`, `audit_log(id, actor_user_id, actor_role, entity_type, entity_id, action, old_value, new_value, note, created_at)`. Function `public.handle_new_user()` + trigger on `auth.users`.

- [ ] **Step 1: Wipe the leftover `ncht` schema**

Call `mcp__supabase__execute_sql` with `project_id: "dojevarrfczgmyxzpfbx"`:

```sql
drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
```

- [ ] **Step 2: Apply the base schema migration**

Call `mcp__supabase__apply_migration` with `project_id: "dojevarrfczgmyxzpfbx"`, `name: "001_base_schema"`:

```sql
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'supplier', 'admin')),
  telegram_user_id bigint unique,
  telegram_username text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own_display" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  lat double precision not null,
  lng double precision not null
);

alter table public.cities enable row level security;

create policy "cities_select_all" on public.cities
  for select using (true);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);

alter table public.categories enable row level security;

create policy "categories_select_all" on public.categories
  for select using (true);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  note text,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;
```

No `SELECT`/`INSERT` policy exists on `audit_log` for `anon`/`authenticated` — deliberately unreadable/unwritable by clients; only `service_role` (used inside Edge Functions) bypasses RLS.

- [ ] **Step 3: Seed cities and categories**

Call `mcp__supabase__apply_migration` with `project_id: "dojevarrfczgmyxzpfbx"`, `name: "002_seed_cities_categories"`:

```sql
insert into public.cities (slug, name, lat, lng) values
  ('moscow', 'Москва', 55.7558, 37.6173),
  ('spb', 'Санкт-Петербург', 59.9311, 30.3609),
  ('kazan', 'Казань', 55.7887, 49.1221),
  ('ekaterinburg', 'Екатеринбург', 56.8389, 60.6057),
  ('novosibirsk', 'Новосибирск', 55.0084, 82.9357),
  ('krasnodar', 'Краснодар', 45.0355, 38.9753);

insert into public.categories (slug, name, sort_order) values
  ('products', 'Продукты', 0),
  ('coffee-tea', 'Кофе и чай', 1),
  ('drinks', 'Напитки', 2),
  ('alcohol', 'Алкоголь', 3),
  ('packaging', 'Упаковка', 4),
  ('equipment', 'Оборудование', 5),
  ('furniture', 'Мебель', 6),
  ('tableware', 'Посуда', 7),
  ('chemistry', 'Химия', 8),
  ('it-services', 'IT и сервисы', 9),
  ('education', 'Обучение', 10),
  ('logistics', 'Логистика', 11),
  ('other', 'Другое', 12);
```

- [ ] **Step 4: Verify**

Call `mcp__supabase__execute_sql` with `project_id: "dojevarrfczgmyxzpfbx"`, query `select count(*) from public.cities;` — expect `6`. Then `select count(*) from public.categories;` — expect `13`.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-09-15-backend-foundation.md
git commit -m "chore: begin backend foundation — base schema (profiles, cities, categories, audit_log)"
```

(Nothing else changed in the repo yet — the commit just checkpoints plan progress. Later tasks add real file changes.)

---

### Task 2: Supplier schema

**Files:** Supabase migration only.

**Interfaces:**
- Consumes: `public.categories`, `public.cities`, `public.profiles` (Task 1).
- Produces: `suppliers(id, slug, name, short_description, about, founded_year, logo_url, city_id, status, verification_level, rating, review_count, website_url, telegram, phone, min_order, delivery_available, pickup_available, works_with_legal_entities, works_with_individual_entrepreneurs, deferred_payment, payment_methods, owner_user_id, created_at, updated_at)`, junction tables `supplier_categories(supplier_id, category_id)`, `supplier_service_cities(supplier_id, city_id)`, and `supplier_addresses(id, supplier_id, address, lat, lng)`.

- [ ] **Step 1: Apply the suppliers migration**

`mcp__supabase__apply_migration`, `project_id: "dojevarrfczgmyxzpfbx"`, `name: "003_suppliers"`:

```sql
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null,
  about text not null,
  founded_year int,
  logo_url text,
  city_id uuid not null references public.cities(id),
  status text not null default 'pending' check (status in ('draft', 'pending', 'published', 'rejected', 'blocked')),
  verification_level text not null default 'none' check (verification_level in ('none', 'confirmed', 'verified')),
  rating numeric(2,1) not null default 0,
  review_count int not null default 0,
  website_url text,
  telegram text,
  phone text,
  min_order int,
  delivery_available boolean not null default false,
  pickup_available boolean not null default false,
  works_with_legal_entities boolean not null default false,
  works_with_individual_entrepreneurs boolean not null default false,
  deferred_payment boolean not null default false,
  payment_methods text[] not null default '{}',
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;

create policy "suppliers_select_published" on public.suppliers
  for select using (status = 'published');

create table public.supplier_categories (
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (supplier_id, category_id)
);

alter table public.supplier_categories enable row level security;

create policy "supplier_categories_select_all" on public.supplier_categories
  for select using (true);

create table public.supplier_service_cities (
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  primary key (supplier_id, city_id)
);

alter table public.supplier_service_cities enable row level security;

create policy "supplier_service_cities_select_all" on public.supplier_service_cities
  for select using (true);

create table public.supplier_addresses (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  address text not null,
  lat double precision not null,
  lng double precision not null
);

alter table public.supplier_addresses enable row level security;

create policy "supplier_addresses_select_all" on public.supplier_addresses
  for select using (true);
```

No `INSERT`/`UPDATE`/`DELETE` policy exists on any of these four tables for `anon`/`authenticated` — publishing/editing suppliers is an admin/supplier-dashboard action, neither built in this pass, so there is deliberately no client write path yet.

- [ ] **Step 2: Seed suppliers from the current fixtures**

Call `mcp__supabase__apply_migration`, `project_id: "dojevarrfczgmyxzpfbx"`, `name: "004_seed_suppliers"`. This inserts the same 18 suppliers currently in `lib/data/fixtures/suppliers.ts`, mapping `status: "unverified"|"confirmed"|"verified"` to `verification_level` (all seeded suppliers are `status = 'published'` in the new schema — they're already live on the public site today) and `regions: string[]` to `supplier_service_cities` rows:

```sql
with s as (
  insert into public.suppliers
    (slug, name, short_description, about, founded_year, city_id, status, verification_level, rating, review_count, website_url, telegram, phone, min_order, delivery_available, pickup_available, works_with_legal_entities, works_with_individual_entrepreneurs, deferred_payment, payment_methods, created_at, updated_at)
  select
    v.slug, v.name, v.short_description, v.about, v.founded_year,
    (select id from public.cities where slug = v.city_slug),
    'published', v.verification_level, v.rating, v.review_count,
    v.website_url, v.telegram, v.phone, v.min_order, v.delivery, v.pickup,
    v.works_legal, v.works_ip, v.deferred_payment, v.payment_methods,
    v.created_at, v.updated_at
  from (values
    ('rostery-nord', 'Rostery Nord', 'Свежая обжарка кофе для HoReCa, еженедельные поставки по Москве.', 'Обжариваем зерно партиями под конкретного клиента и отгружаем в течение недели после обжарки. Работаем с кофейнями и ресторанами, от одной точки до сети.', 2016, 'moscow', 'verified', 4.8, 142, 'https://rostery-nord.example', 'https://t.me/rosterynord', '+7 495 000-11-22', 5000, true, true, true, true, true, array['Безналичный расчет','Карта','Наличные'], now(), '2026-08-20'::timestamptz),
    ('molterra', 'Молтерра', 'Молочная продукция для кофеен и ресторанов с ежедневной доставкой.', 'Поставляем молочную продукцию для кофеен и ресторанов: молоко, сливки, сыры. Доставляем ежедневно, что позволяет заведениям работать без больших запасов на складе.', 2012, 'moscow', 'confirmed', 4.5, 87, 'https://molterra.example', 'https://t.me/molterra', '+7 495 100-11-22', 3000, true, false, true, false, false, array['Безналичный расчет','Карта'], now(), '2026-06-22'::timestamptz),
    ('upak-snab', 'УпакСнаб', 'Экологичная упаковка на вынос: стаканы, контейнеры, крафт-пакеты.', 'Предлагаем экологичную упаковку на вынос — стаканы, контейнеры и крафт-пакеты. Помогаем кафе и службам доставки перейти на более экологичные материалы.', null, 'spb', 'none', 4.1, 23, 'https://upak-snab.example', 'https://t.me/upaksnab', '+7 812 200-11-22', 2000, true, true, true, true, false, array['Безналичный расчет','Карта','Наличные'], now(), '2026-06-30'::timestamptz),
    ('baristek', 'Баристек', 'Кофемашины, кофемолки и сервис оборудования для кофеен.', 'Поставляем кофемашины и кофемолки, а также обслуживаем и ремонтируем оборудование для кофеен. Работаем как с новыми точками, так и с действующими кофейнями.', 2009, 'moscow', 'verified', 4.9, 201, 'https://baristek.example', 'https://t.me/baristek', '+7 495 300-11-22', null, true, true, true, false, true, array['Безналичный расчет','Карта','Наличные'], now(), '2026-09-10'::timestamptz),
    ('chaynyy-dom-vostok', 'Чайный Дом Восток', 'Листовой чай, сиропы и основы для чайных напитков оптом.', 'Поставляем листовой чай, сиропы и основы для чайных напитков оптом. Подбираем ассортимент под формат заведения — от чайной до кофейни.', 2018, 'kazan', 'confirmed', 4.3, 34, 'https://chaynyy-dom-vostok.example', 'https://t.me/chaynyydomvostok', '+7 843 400-11-22', 4000, true, false, true, true, false, array['Безналичный расчет','Карта'], now(), '2026-07-15'::timestamptz),
    ('barhat-mebel', 'Бархат Мебель', 'Мебель для кафе и ресторанов на заказ и со склада.', 'Изготавливаем мебель для кафе и ресторанов на заказ, а часть моделей отгружаем со склада без ожидания производства. Подходит для обустройства зала и барной зоны.', 2014, 'moscow', 'confirmed', 4.6, 58, 'https://barhat-mebel.example', 'https://t.me/barhatmebel', '+7 495 500-11-22', null, true, true, true, false, true, array['Безналичный расчет','Карта','Наличные'], now(), '2026-08-02'::timestamptz),
    ('posuda-plus', 'Посуда+', 'Фарфоровая и стеклянная посуда для заведений общепита.', 'Поставляем фарфоровую и стеклянную посуду для заведений общепита. Подбираем комплекты посуды под концепцию и стиль подачи заведения.', null, 'ekaterinburg', 'none', 3.9, 12, 'https://posuda-plus.example', null, '+7 343 600-11-22', 1500, true, true, true, true, false, array['Безналичный расчет','Карта','Наличные'], now(), '2026-06-25'::timestamptz),
    ('chisto-pro', 'ЧистоПро', 'Профессиональная химия для кухни и зала: от мытья посуды до дезинфекции.', 'Поставляем профессиональную химию для кухни и зала — от средств для мытья посуды до дезинфицирующих составов. Работаем с заведениями общепита любого формата.', 2015, 'moscow', 'confirmed', 4.4, 45, 'https://chisto-pro.example', 'https://t.me/chistopro', '+7 495 700-11-22', 2500, true, false, true, true, false, array['Безналичный расчет','Карта'], now(), '2026-07-28'::timestamptz),
    ('kassa-oblako', 'Касса Облако', 'Облачные кассы и учёт для кафе и ресторанов, подключение за день.', 'Предоставляем облачные кассы и системы учёта для кафе и ресторанов. Подключение занимает один день, что удобно для открытия новых точек.', 2019, 'spb', 'verified', 4.7, 76, 'https://kassa-oblako.example', 'https://t.me/kassaoblako', '+7 812 800-11-22', null, false, false, true, true, true, array['Безналичный расчет','Карта'], now(), '2026-09-05'::timestamptz),
    ('barmen-school', 'Школа Бармена', 'Обучение и аттестация барменов, бариста и линейного персонала.', 'Проводим обучение и аттестацию барменов, бариста и линейного персонала. Программы подходят как для новых сотрудников, так и для действующей команды.', 2017, 'moscow', 'confirmed', 4.2, 19, 'https://barmen-school.example', 'https://t.me/barmenschool', '+7 495 900-11-22', null, false, false, true, false, false, array['Безналичный расчет','Карта'], now(), '2026-07-10'::timestamptz),
    ('log-express', 'ЛогЭкспресс', 'Логистика и доставка сырья для кафе и ресторанов по Сибири.', 'Организуем логистику и доставку сырья для кафе и ресторанов по Сибири. Помогаем выстроить регулярные поставки под график заведения.', null, 'novosibirsk', 'none', 4.0, 9, 'https://log-express.example', null, '+7 383 100-22-33', null, true, false, true, true, false, array['Безналичный расчет','Карта'], now(), '2026-06-18'::timestamptz),
    ('vino-yug', 'Вино Юга', 'Оптовые поставки вина и крепкого алкоголя для баров и ресторанов.', 'Осуществляем оптовые поставки вина и крепкого алкоголя для баров и ресторанов. Предлагаем расширенный ассортимент под разные форматы заведений.', 2011, 'krasnodar', 'verified', 4.6, 63, 'https://vino-yug.example', 'https://t.me/vinoyug', '+7 861 200-22-33', 10000, true, true, true, false, true, array['Безналичный расчет','Карта','Наличные'], now(), '2026-08-25'::timestamptz),
    ('myasnoy-dvor', 'Мясной Двор', 'Мясо и полуфабрикаты для ресторанов с ежедневной свежей поставкой.', 'Поставляем мясо и полуфабрикаты для ресторанов с ежедневной свежей поставкой. Работаем под потребности кухни — от стейков до полуфабрикатов для быстрого приготовления.', 2013, 'moscow', 'confirmed', 4.5, 98, 'https://myasnoy-dvor.example', 'https://t.me/myasnoydvor', '+7 495 300-22-33', 5000, true, true, true, true, false, array['Безналичный расчет','Карта','Наличные'], now(), '2026-09-01'::timestamptz),
    ('sirop-lab', 'Сироп Лаб', 'Сиропы, топпинги и основы для кофеен и кофе-баров.', 'Производим сиропы, топпинги и основы для кофеен и кофе-баров. Помогаем разнообразить меню напитков без изменения оборудования.', 2020, 'spb', 'verified', 4.8, 110, 'https://sirop-lab.example', 'https://t.me/siroplab', '+7 812 400-22-33', 3000, true, true, true, true, false, array['Безналичный расчет','Карта','Наличные'], now(), '2026-08-30'::timestamptz),
    ('stol-i-stul', 'Стол и Стул', 'Столы, стулья и барные стойки для заведений под ключ.', 'Поставляем столы, стулья и барные стойки для заведений под ключ. Подбираем комплекты мебели под формат и площадь помещения.', null, 'ekaterinburg', 'none', 3.8, 7, 'https://stol-i-stul.example', 'https://t.me/stolistul', '+7 343 500-22-33', null, true, true, true, false, false, array['Безналичный расчет','Карта','Наличные'], now(), '2026-06-27'::timestamptz),
    ('pekarnya-opt', 'Пекарня Опт', 'Замороженная выпечка и полуфабрикаты для кофеен и пекарен.', 'Поставляем замороженную выпечку и полуфабрикаты для кофеен и пекарен. Ассортимент позволяет расширить меню без своего цеха выпечки.', 2016, 'moscow', 'confirmed', 4.4, 71, 'https://pekarnya-opt.example', 'https://t.me/pekarnyaopt', '+7 495 600-22-33', 2000, true, true, true, true, false, array['Безналичный расчет','Карта','Наличные'], now(), '2026-08-12'::timestamptz),
    ('bar-oborud', 'БарОборудование', 'Барное оборудование и холодильные витрины для HoReCa.', 'Поставляем барное оборудование и холодильные витрины для HoReCa. Подбираем комплектацию под формат бара или ресторана.', 2012, 'krasnodar', 'confirmed', 4.3, 28, 'https://bar-oborud.example', 'https://t.me/baroborud', '+7 861 700-22-33', null, true, true, true, false, true, array['Безналичный расчет','Карта','Наличные'], now(), '2026-07-20'::timestamptz),
    ('eco-pack-nsk', 'ЭкоПак НСК', 'Биоразлагаемая упаковка для доставки еды и напитков.', 'Поставляем биоразлагаемую упаковку для доставки еды и напитков. Работаем со службами доставки и заведениями, переходящими на экологичные материалы.', 2019, 'novosibirsk', 'verified', 4.7, 54, 'https://eco-pack-nsk.example', 'https://t.me/ecopacknsk', '+7 383 800-22-33', 1000, true, false, true, true, false, array['Безналичный расчет','Карта'], now(), '2026-09-08'::timestamptz)
  ) as v(slug, name, short_description, about, founded_year, city_slug, verification_level, rating, review_count, website_url, telegram, phone, min_order, delivery, pickup, works_legal, works_ip, deferred_payment, payment_methods, created_at, updated_at)
  returning id, slug
)
insert into public.supplier_categories (supplier_id, category_id)
select s.id, c.id
from s
join (values
  ('rostery-nord', 'coffee-tea'), ('molterra', 'products'), ('upak-snab', 'packaging'),
  ('baristek', 'equipment'), ('baristek', 'coffee-tea'), ('chaynyy-dom-vostok', 'coffee-tea'),
  ('chaynyy-dom-vostok', 'drinks'), ('barhat-mebel', 'furniture'), ('posuda-plus', 'tableware'),
  ('chisto-pro', 'chemistry'), ('kassa-oblako', 'it-services'), ('barmen-school', 'education'),
  ('log-express', 'logistics'), ('vino-yug', 'alcohol'), ('vino-yug', 'drinks'),
  ('myasnoy-dvor', 'products'), ('sirop-lab', 'coffee-tea'), ('sirop-lab', 'drinks'),
  ('stol-i-stul', 'furniture'), ('pekarnya-opt', 'products'), ('bar-oborud', 'equipment'),
  ('eco-pack-nsk', 'packaging')
) as m(slug, category_slug) on m.slug = s.slug
join public.categories c on c.slug = m.category_slug;

insert into public.supplier_service_cities (supplier_id, city_id)
select su.id, ci.id
from public.suppliers su
join (values
  ('rostery-nord', 'moscow'), ('rostery-nord', 'spb'), ('molterra', 'moscow'),
  ('upak-snab', 'spb'), ('upak-snab', 'moscow'), ('baristek', 'moscow'), ('baristek', 'spb'),
  ('chaynyy-dom-vostok', 'kazan'), ('chaynyy-dom-vostok', 'ekaterinburg'), ('barhat-mebel', 'moscow'),
  ('posuda-plus', 'ekaterinburg'), ('chisto-pro', 'moscow'), ('kassa-oblako', 'spb'),
  ('barmen-school', 'moscow'), ('log-express', 'novosibirsk'), ('vino-yug', 'krasnodar'),
  ('vino-yug', 'moscow'), ('myasnoy-dvor', 'moscow'), ('sirop-lab', 'spb'), ('sirop-lab', 'moscow'),
  ('stol-i-stul', 'ekaterinburg'), ('pekarnya-opt', 'moscow'), ('bar-oborud', 'krasnodar'),
  ('eco-pack-nsk', 'novosibirsk'), ('eco-pack-nsk', 'ekaterinburg')
) as m(slug, city_slug) on m.slug = su.slug
join public.cities ci on ci.slug = m.city_slug;
```

- [ ] **Step 3: Verify**

`mcp__supabase__execute_sql`, `project_id: "dojevarrfczgmyxzpfbx"`, query `select count(*) from public.suppliers;` — expect `18`. Then `select count(*) from public.supplier_categories;` — expect `22`. Then `select count(*) from public.supplier_service_cities;` — expect `25`.

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -am "chore: backend foundation — supplier schema + seed data"
```

---

### Task 3: Offers and promo codes schema

**Files:** Supabase migration only.

**Interfaces:**
- Consumes: `public.suppliers`, `public.categories` (Tasks 1-2).
- Produces: `offers(id, supplier_id, title, description, terms, category_id, expires_at, status, created_at)`, `promo_codes(id, offer_id, code, discount_description, terms, min_order, starts_at, ends_at, max_uses)`.

- [ ] **Step 1: Apply the offers migration**

`mcp__supabase__apply_migration`, `project_id: "dojevarrfczgmyxzpfbx"`, `name: "005_offers"`:

```sql
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  title text not null,
  description text not null,
  terms text,
  category_id uuid references public.categories(id),
  expires_at date,
  status text not null default 'published' check (status in ('draft', 'pending', 'published', 'rejected', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;

create policy "offers_select_published" on public.offers
  for select using (status = 'published');

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  code text not null,
  discount_description text,
  terms text,
  min_order int,
  starts_at date,
  ends_at date,
  max_uses int
);

alter table public.promo_codes enable row level security;

create policy "promo_codes_select_via_published_offer" on public.promo_codes
  for select using (
    exists (select 1 from public.offers o where o.id = offer_id and o.status = 'published')
  );
```

- [ ] **Step 2: Seed offers from the current fixtures**

`mcp__supabase__apply_migration`, `project_id: "dojevarrfczgmyxzpfbx"`, `name: "006_seed_offers"`:

```sql
with o as (
  insert into public.offers (supplier_id, title, description, category_id, expires_at)
  select
    (select id from public.suppliers where slug = v.supplier_slug),
    v.title, v.description,
    (select id from public.categories where slug = v.category_slug),
    v.expires_at::date
  from (values
    ('rostery-nord', 'Бесплатная доставка от 15 000 ₽', 'Доставка кофе по Москве без наценки при заказе от 15 000 ₽.', 'coffee-tea', '2026-12-31'),
    ('sirop-lab', '−15% новым клиентам', 'Скидка на первый заказ сиропов и топпингов для новых кофеен.', 'coffee-tea', '2026-11-30'),
    ('vino-yug', 'Специальные условия для баров', 'Расширенная отсрочка платежа для баров при заказе от 10 000 ₽.', 'alcohol', '2026-10-31'),
    ('eco-pack-nsk', 'Бесплатный образец упаковки', 'Пробный набор биоразлагаемой упаковки для новых клиентов.', 'packaging', '2026-12-15'),
    ('myasnoy-dvor', '−10% на первый заказ мяса', 'Скидка для новых ресторанов и кафе на первую поставку мясной продукции.', 'products', '2026-11-15'),
    ('kassa-oblako', 'Бесплатное подключение кассы', 'Настройка и подключение облачной кассы без оплаты за первый месяц.', 'it-services', '2026-12-01'),
    ('barhat-mebel', 'Рассрочка на мебель для кафе', 'Рассрочка 0% на 6 месяцев при заказе мебели для нового заведения.', 'furniture', '2026-12-31')
  ) as v(supplier_slug, title, description, category_slug, expires_at)
  returning id, title
)
insert into public.promo_codes (offer_id, code)
select o.id, m.code
from o
join (values
  ('−15% новым клиентам', 'GRYADKA15'),
  ('Бесплатный образец упаковки', 'ECOPACK'),
  ('−10% на первый заказ мяса', 'MYASO10')
) as m(title, code) on m.title = o.title;
```

- [ ] **Step 3: Verify**

`select count(*) from public.offers;` — expect `7`. `select count(*) from public.promo_codes;` — expect `3`.

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -am "chore: backend foundation — offers + promo codes schema"
```

---

### Task 4: Reviews schema + rating recalculation trigger

**Files:** Supabase migration only.

**Interfaces:**
- Consumes: `public.suppliers`, `public.profiles`.
- Produces: `reviews(id, supplier_id, user_id, overall_rating, price_rating, quality_rating, delivery_rating, service_rating, comment, status, created_at)`. Trigger function `public.recalculate_supplier_rating()`.

- [ ] **Step 1: Apply the reviews migration**

`mcp__supabase__apply_migration`, `project_id: "dojevarrfczgmyxzpfbx"`, `name: "007_reviews"`:

```sql
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  overall_rating int not null check (overall_rating between 1 and 5),
  price_rating int check (price_rating between 1 and 5),
  quality_rating int check (quality_rating between 1 and 5),
  delivery_rating int check (delivery_rating between 1 and 5),
  service_rating int check (service_rating between 1 and 5),
  comment text not null,
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden', 'removed')),
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "reviews_select_published" on public.reviews
  for select using (status = 'published');

create function public.recalculate_supplier_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_supplier_id uuid;
begin
  target_supplier_id := coalesce(new.supplier_id, old.supplier_id);

  update public.suppliers
  set
    rating = coalesce((
      select round(avg(overall_rating)::numeric, 1)
      from public.reviews
      where supplier_id = target_supplier_id and status = 'published'
    ), 0),
    review_count = (
      select count(*) from public.reviews
      where supplier_id = target_supplier_id and status = 'published'
    )
  where id = target_supplier_id;

  return new;
end;
$$;

revoke all on function public.recalculate_supplier_rating() from public, anon, authenticated;

create trigger on_review_status_change
  after insert or update of status or delete on public.reviews
  for each row execute function public.recalculate_supplier_rating();
```

No `INSERT` policy exists for `anon`/`authenticated` — the `submit-review` Edge Function (Task 14) writes via service role. The trigger fires `or delete` too, not just insert/update — a review can be deleted (test cleanup, or a future admin hard-delete), and without the delete case the supplier's `rating`/`review_count` would go stale forever after that row disappears. `coalesce(new.supplier_id, old.supplier_id)` inside the function handles all three trigger operations safely (`NEW` is unset on `DELETE`, `OLD` is unset on `INSERT` — `coalesce` picks whichever one the current operation actually populated).

- [ ] **Step 2: Verify the trigger fires — on a throwaway supplier, not a seeded one**

The seeded suppliers (Task 2) carry realistic-looking `rating`/`review_count` values as fixture display data, with **no actual rows in `reviews` backing them** — the trigger recalculates strictly from `reviews`, so firing it even once for a seeded supplier overwrites its fixture numbers with the real (initially zero) aggregate, permanently. Verify against a disposable supplier row created and dropped in the same block, never against `rostery-nord` or any other seeded slug:

`mcp__supabase__execute_sql`, `project_id: "dojevarrfczgmyxzpfbx"`:

```sql
do $$
declare
  test_supplier_id uuid;
  test_user_id uuid;
  test_city_id uuid;
begin
  select id into test_city_id from public.cities where slug = 'moscow';

  insert into public.suppliers (slug, name, short_description, about, city_id, status)
  values ('test-rating-trigger', 'Test', 'test', 'test', test_city_id, 'published')
  returning id into test_supplier_id;

  insert into auth.users (id, email) values (gen_random_uuid(), 'test-review@example.com') returning id into test_user_id;

  insert into public.reviews (supplier_id, user_id, overall_rating, comment, status)
  values (test_supplier_id, test_user_id, 5, 'test', 'published');

  assert (select review_count from public.suppliers where id = test_supplier_id) = 1,
    'review_count did not update on insert';
  assert (select rating from public.suppliers where id = test_supplier_id) = 5.0,
    'rating did not update on insert';

  delete from public.reviews where supplier_id = test_supplier_id;

  assert (select review_count from public.suppliers where id = test_supplier_id) = 0,
    'review_count did not reset on delete';

  delete from auth.users where id = test_user_id;
  delete from public.suppliers where id = test_supplier_id;
  raise notice 'rating trigger verified OK';
end $$;
```

Expect a `NOTICE: rating trigger verified OK` with no assertion failure. Everything created in this block (`test-rating-trigger` supplier, the test auth user, the review) is deleted before the block ends — nothing seeded is touched.

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -am "chore: backend foundation — reviews schema + rating recalculation trigger"
```

---

### Task 5: Applications, suggestions, error reports, analytics

**Files:** Supabase migration only.

**Interfaces:**
- Produces: `supplier_applications`, `supplier_suggestions`, `error_reports`, `analytics_events`.

- [ ] **Step 1: Apply the migration**

`mcp__supabase__apply_migration`, `project_id: "dojevarrfczgmyxzpfbx"`, `name: "008_forms_and_analytics"`:

```sql
create table public.supplier_applications (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  website text,
  telegram text,
  city_id uuid references public.cities(id),
  category_slugs text[] not null default '{}',
  regions text,
  description text,
  address text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  created_at timestamptz not null default now()
);

alter table public.supplier_applications enable row level security;

create table public.supplier_suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  city_id uuid references public.cities(id),
  category_id uuid references public.categories(id),
  comment text,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.supplier_suggestions enable row level security;

create table public.error_reports (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  issue_type text not null check (issue_type in ('wrong_phone', 'wrong_website', 'company_closed', 'wrong_address', 'wrong_category', 'other')),
  comment text,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.error_reports enable row level security;

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'search', 'view_supplier', 'view_category', 'view_offer',
    'click_website', 'click_telegram', 'click_phone', 'copy_promo',
    'register', 'submit_application', 'submit_suggestion',
    'submit_review', 'submit_error_report'
  )),
  supplier_id uuid references public.suppliers(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  promo_code_id uuid references public.promo_codes(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  city_id uuid references public.cities(id) on delete set null,
  query_text text,
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  source_page text,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

create policy "analytics_events_insert_all" on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);
```

`supplier_applications`, `supplier_suggestions`, and `error_reports` get no client-facing policy at all (default-deny) — only their Edge Functions (Tasks 12, 13, 15) write to them via service role. `analytics_events` is the one deliberate exception: `INSERT`-only, no `SELECT`, matching the spec's narrow carve-out.

- [ ] **Step 2: Verify RLS default-deny**

`mcp__supabase__execute_sql`, `project_id: "dojevarrfczgmyxzpfbx"`:

```sql
set role anon;
select count(*) from public.supplier_applications;
```

Expect `0` rows back (not an error — `SELECT` with no matching policy returns empty under RLS), confirming no read leak. Then:

```sql
insert into public.supplier_applications (company_name, contact_name, phone, email)
values ('test', 'test', 'test', 'test');
```

Expect an error: `new row violates row-level security policy` (or "permission denied") — confirming anon cannot insert directly. Then reset:

```sql
reset role;
```

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -am "chore: backend foundation — applications, suggestions, error reports, analytics schema"
```

---

### Task 6: Supabase client wiring in Next.js

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `.env.local` (not committed — gitignored)
- Modify: `.env.example` (create if it doesn't exist)
- Modify: `package.json` (add dependencies)

**Interfaces:**
- Produces: `createBrowserSupabaseClient(): SupabaseClient` (for Client Components), `createServerSupabaseClient(): Promise<SupabaseClient>` (for Server Components, reads/writes the Next.js cookie store for session persistence).

- [ ] **Step 1: Get project URL and anon key**

Call `mcp__supabase__get_project_url` with `project_id: "dojevarrfczgmyxzpfbx"` and `mcp__supabase__get_publishable_keys` with the same `project_id`. Use the returned URL and the legacy anon key (JWT-based — `@supabase/ssr` and `@supabase/supabase-js` at the versions this project will install expect that format) for the next step.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Write environment files**

Create `.env.local` (values from Step 1):

```
NEXT_PUBLIC_SUPABASE_URL=<the project URL from Step 1>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon key from Step 1>
```

Create `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Confirm `.env.local` is covered by the existing `.gitignore` (Next.js's default `.gitignore` already excludes `.env*.local` — verify with `git check-ignore .env.local`; expect it to print the path, confirming it's ignored).

- [ ] **Step 4: Write the browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 5: Write the server client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't set cookies during render; middleware
            // or a Route Handler refreshes the session instead.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 6: Verify it builds**

```bash
npm run build
```

Expect a clean build (no runtime call is made yet — these are unused exports until Task 8).

- [ ] **Step 7: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts .env.example package.json package-lock.json
git commit -m "feat: wire up Supabase client (browser + server)"
```

---

### Task 7: Swap `getCategories`/`getCities` to Supabase

**Files:**
- Modify: `lib/data/suppliers.ts`
- Modify: `lib/data/suppliers.test.ts`

**Interfaces:**
- Consumes: `createServerSupabaseClient` (Task 6).
- Produces (unchanged): `getCategories(): Promise<Category[]>`, `getCities(): Promise<City[]>`.

- [ ] **Step 1: Update the test to not assume fixture-array identity**

The existing `getCategories` test only checks a length threshold, so it already works unchanged against real data — no test edit needed for this task. Confirm by reading `lib/data/suppliers.test.ts:66-71` (already covered above): `expect(result.length).toBeGreaterThanOrEqual(10)` holds against the 13 seeded categories.

- [ ] **Step 2: Replace the fixture-backed implementations**

In `lib/data/suppliers.ts`, replace:

```typescript
export async function getCategories(): Promise<Category[]> {
  return allCategories.slice();
}

export async function getCities(): Promise<City[]> {
  return allCities.slice();
}
```

with:

```typescript
export async function getCategories(): Promise<Category[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name")
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getCities(): Promise<City[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cities")
    .select("slug, name, lat, lng")
    .order("name");
  if (error) throw error;
  return data;
}
```

Add the import at the top of the file: `import { createServerSupabaseClient } from "@/lib/supabase/server";`. Leave `allCategories`/`allCities` imports in place for now — later steps in this task remove them once nothing references them.

- [ ] **Step 3: Run the existing tests**

```bash
npm test
```

Expect the `getCategories` describe block to pass against the live database. (`getSuppliers`/`getSupplierBySlug`/`searchSuppliers` tests still pass too, since they're untouched fixture-backed code until Task 8 — this task only touches the two functions above.)

- [ ] **Step 4: Remove the now-unused category/city fixture imports from this file**

Since `getSuppliers`/`searchSuppliers` still use `allCategories`/`allCities` for name-lookup at this point in the plan, leave the imports in `lib/data/suppliers.ts` until Task 9 removes the last use.

- [ ] **Step 5: Commit**

```bash
git add lib/data/suppliers.ts
git commit -m "feat: back getCategories/getCities with real Supabase queries"
```

---

### Task 8: Swap `getSuppliers`/`getSupplierBySlug`/`getOffers` to Supabase

**Files:**
- Modify: `lib/data/suppliers.ts`
- Modify: `lib/data/suppliers.test.ts`

**Interfaces:**
- Produces (unchanged): `getSuppliers(filters: SupplierFilters): Promise<Supplier[]>`, `getSupplierBySlug(slug: string): Promise<Supplier | null>`, `getOffers(supplierSlug?: string): Promise<Offer[]>`.

- [ ] **Step 1: Write a mapping helper for the nested Supabase row shape**

The `Supplier` type is a flat object with nested `conditions`/`contacts`; the database is normalized (junction tables for categories/cities, flat columns for everything else). Add this helper above `getSuppliers` in `lib/data/suppliers.ts`:

```typescript
type SupplierRow = {
  slug: string;
  name: string;
  short_description: string;
  about: string;
  founded_year: number | null;
  rating: number;
  review_count: number;
  verification_level: "none" | "confirmed" | "verified";
  website_url: string | null;
  telegram: string | null;
  phone: string | null;
  min_order: number | null;
  delivery_available: boolean;
  pickup_available: boolean;
  works_with_legal_entities: boolean;
  works_with_individual_entrepreneurs: boolean;
  deferred_payment: boolean;
  payment_methods: string[];
  updated_at: string;
  cities: { slug: string };
  supplier_categories: { categories: { slug: string } }[];
  supplier_service_cities: { cities: { slug: string } }[];
};

function mapSupplierRow(row: SupplierRow): Supplier {
  return {
    slug: row.slug,
    name: row.name,
    city: row.cities.slug,
    regions: row.supplier_service_cities.map((r) => r.cities.slug),
    categories: row.supplier_categories.map((r) => r.categories.slug),
    shortDescription: row.short_description,
    about: row.about,
    rating: row.rating,
    reviewCount: row.review_count,
    status: row.verification_level === "none" ? "unverified" : row.verification_level,
    conditions: {
      delivery: row.delivery_available,
      pickup: row.pickup_available,
      minOrder: row.min_order ?? undefined,
      worksWithLegalEntities: row.works_with_legal_entities,
      worksWithIndividualEntrepreneurs: row.works_with_individual_entrepreneurs,
      deferredPayment: row.deferred_payment,
      paymentMethods: row.payment_methods,
    },
    contacts: {
      phone: row.phone ?? undefined,
      website: row.website_url ?? undefined,
      telegram: row.telegram ?? undefined,
    },
    foundedYear: row.founded_year ?? undefined,
    keywords: [],
    updatedAt: row.updated_at,
  };
}

const SUPPLIER_SELECT = `
  slug, name, short_description, about, founded_year, rating, review_count,
  verification_level, website_url, telegram, phone, min_order,
  delivery_available, pickup_available, works_with_legal_entities,
  works_with_individual_entrepreneurs, deferred_payment, payment_methods, updated_at,
  cities!inner(slug),
  supplier_categories(categories(slug)),
  supplier_service_cities(cities(slug))
`;
```

`keywords` becomes `[]` — the fixture-only free-text keyword list has no database column (§26 already covered by matching name/city/category directly; Task 9 handles that). No current caller reads `supplier.keywords` outside `scoreSupplier`, which Task 9 replaces.

- [ ] **Step 2: Replace `getSuppliers`**

Replace the function body:

```typescript
export async function getSuppliers(filters: SupplierFilters = {}): Promise<Supplier[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("suppliers")
    .select(SUPPLIER_SELECT)
    .eq("status", "published");

  if (filters.city) {
    query = query.or(
      `cities.slug.eq.${filters.city},supplier_service_cities.cities.slug.eq.${filters.city}`,
    );
  }
  if (filters.category) {
    query = query.eq("supplier_categories.categories.slug", filters.category);
  }
  if (filters.delivery) {
    query = query.eq("delivery_available", true);
  }
  if (filters.pickup) {
    query = query.eq("pickup_available", true);
  }
  if (filters.confirmedOnly) {
    query = query.neq("verification_level", "none");
  }

  const { data, error } = await query;
  if (error) throw error;
  let result = data.map(mapSupplierRow);

  if (filters.query) {
    result = await filterByQuery(result, filters.query);
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
```

`filterByQuery` is defined in Task 9 (the text-search path) — this task leaves a forward reference that Task 9 resolves immediately after, since both tasks touch the same function and splitting the query-filter logic into its own task would leave `getSuppliers` referencing an undefined function in between. Do Task 9's Step 1 before running tests for this task.

- [ ] **Step 3: Replace `getSupplierBySlug`**

```typescript
export async function getSupplierBySlug(slug: string): Promise<Supplier | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select(SUPPLIER_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data ? mapSupplierRow(data) : null;
}
```

- [ ] **Step 4: Replace `getOffers`**

`offer.city` is read today in `components/offer-card.tsx:13` (display chip) and `app/offers/page.tsx:32` (filter). An offer has no single city column in the new schema — it belongs to a supplier, which has one home `city_id` — so `city` on the returned `Offer` becomes the supplier's home city slug, via a join, keeping the `Offer` type and both call sites unchanged:

```typescript
export async function getOffers(supplierSlug?: string): Promise<Offer[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("offers")
    .select("id, title, description, expires_at, categories(slug), suppliers!inner(slug, cities(slug)), promo_codes(code)")
    .eq("status", "published");

  if (supplierSlug) {
    query = query.eq("suppliers.slug", supplierSlug);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    supplierSlug: row.suppliers.slug,
    title: row.title,
    description: row.description,
    category: row.categories?.slug,
    city: row.suppliers.cities.slug,
    expiresAt: row.expires_at ?? undefined,
    promoCode: row.promo_codes[0]?.code,
  }));
}
```

- [ ] **Step 5: Update `app/offers/page.tsx` to use `getOffers` instead of the fixture array**

Replace the import `import { offers } from "@/lib/data/fixtures/offers";` with `import { getOffers } from "@/lib/data/suppliers";`, and replace:

```typescript
const suppliers = await getSuppliers();

const filteredOffers = offers.filter((offer) => {
  if (category && offer.category !== category) return false;
  if (city && offer.city !== city) return false;
  return true;
});
```

with:

```typescript
const [suppliers, allOffers] = await Promise.all([getSuppliers(), getOffers()]);

const filteredOffers = allOffers.filter((offer) => {
  if (category && offer.category !== category) return false;
  if (city && offer.city !== city) return false;
  return true;
});
```

No other line in the file changes — `OfferCard` and the supplier-name lookup already work off `offer`/`suppliers` exactly as before.

- [ ] **Step 6: Commit**

(Deferred until Task 9 lands `filterByQuery`, since `getSuppliers` doesn't compile without it — see Task 9 Step 4 for the combined commit.)

---

### Task 9: Swap `searchSuppliers` and `scoreSupplier`'s Russian-name matching to Supabase

**Files:**
- Modify: `lib/data/suppliers.ts`
- Delete: `lib/data/scoring.ts`
- Delete: `lib/data/scoring.test.ts`
- Modify: `lib/data/suppliers.test.ts`

**Interfaces:**
- Consumes: `mapSupplierRow`, `SUPPLIER_SELECT` (Task 8).
- Produces (unchanged): `searchSuppliers(query: string): Promise<SearchResult>`. New internal `filterByQuery(suppliers: Supplier[], query: string): Promise<Supplier[]>` used by `getSuppliers` (Task 8, Step 2).

The current `scoreSupplier` (in `lib/data/scoring.ts`) scores an in-memory `Supplier[]` array against a query, resolving city/category slugs to their Russian names via two `Map`s built from the fixture arrays — this is exactly the fix for the real bug found in Pass 1 (autocomplete suggestions showed Russian names but search only matched English slugs). Moving to Postgres, the matching now needs a name lookup that queries `categories`/`cities` directly instead of building `Map`s from an in-memory fixture array — same behavior, different data source.

- [ ] **Step 1: Add `filterByQuery`, replacing `scoreSupplier`**

In `lib/data/suppliers.ts`, add:

```typescript
async function filterByQuery(candidates: Supplier[], query: string): Promise<Supplier[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const supabase = await createServerSupabaseClient();
  const [{ data: cities }, { data: categories }] = await Promise.all([
    supabase.from("cities").select("slug, name"),
    supabase.from("categories").select("slug, name"),
  ]);
  const cityNameBySlug = new Map((cities ?? []).map((c) => [c.slug, c.name.toLowerCase()]));
  const categoryNameBySlug = new Map((categories ?? []).map((c) => [c.slug, c.name.toLowerCase()]));

  function score(supplier: Supplier): number {
    const name = supplier.name.toLowerCase();
    if (name === q) return 100;
    if (name.startsWith(q)) return 80;

    const cityName = cityNameBySlug.get(supplier.city) ?? supplier.city.toLowerCase();
    const categoryNames = supplier.categories.map(
      (slug) => categoryNameBySlug.get(slug) ?? slug.toLowerCase(),
    );

    const categoryHit =
      supplier.categories.some((c) => c.toLowerCase() === q) || categoryNames.some((n) => n === q);
    const cityHit = supplier.city.toLowerCase() === q || cityName === q;
    if (categoryHit || cityHit) return 60;

    const haystack = [name, supplier.city, cityName, ...supplier.categories, ...categoryNames]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) return 30;

    return 0;
  }

  return candidates
    .map((supplier) => ({ supplier, points: score(supplier) }))
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points)
    .map((r) => r.supplier);
}
```

This is the same scoring rules as the old `scoreSupplier`, minus the `keywords` haystack entry (fixture-only free text with no database column — dropped per Task 8 Step 1's note; name/city/category matching covers every case the current fixture data's keywords covered, since they were near-duplicates of the category name in every fixture row).

- [ ] **Step 2: Replace `searchSuppliers`**

```typescript
export async function searchSuppliers(query: string): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return { companies: [], categories: [], cities: [] };

  const supabase = await createServerSupabaseClient();
  const { data: allPublished, error } = await supabase
    .from("suppliers")
    .select(SUPPLIER_SELECT)
    .eq("status", "published");
  if (error) throw error;

  const scored = await filterByQuery(allPublished.map(mapSupplierRow), q);
  const companies = scored.slice(0, 5);

  const lowerQ = q.toLowerCase();
  const { data: categoryMatches } = await supabase
    .from("categories")
    .select("slug, name")
    .ilike("name", `%${lowerQ}%`)
    .limit(5);
  const { data: cityMatches } = await supabase
    .from("cities")
    .select("slug, name, lat, lng")
    .ilike("name", `%${lowerQ}%`)
    .limit(5);

  return {
    companies,
    categories: categoryMatches ?? [],
    cities: cityMatches ?? [],
  };
}
```

- [ ] **Step 3: Remove the fixture imports and delete `scoring.ts`**

In `lib/data/suppliers.ts`, remove these now-unused imports:

```typescript
import { suppliers as allSuppliers } from "./fixtures/suppliers";
import { categories as allCategories } from "./fixtures/categories";
import { cities as allCities } from "./fixtures/cities";
import { offers as allOffers } from "./fixtures/offers";
import { scoreSupplier } from "./scoring";
```

Delete `lib/data/scoring.ts` and `lib/data/scoring.test.ts` (`rm lib/data/scoring.ts lib/data/scoring.test.ts`). Leave `lib/data/fixtures/*` and `lib/data/fixtures/fixtures.test.ts` in place for now — they're dead code after this task but removing them is a separate cleanup, not required for correctness (note it in the final task's "left for later" list if not done by then).

- [ ] **Step 4: Run the full test suite**

```bash
npm test
```

Expect all `lib/data/suppliers.test.ts` describe blocks to pass, including the two Russian-name-matching regression tests (`"returns the same suppliers for a Russian city name as for its slug"` and the category equivalent) — these are exactly the behavior this task preserves. `lib/data/fixtures/fixtures.test.ts` still passes too (it only asserts internal consistency of the fixture arrays, unrelated to whether anything reads them).

- [ ] **Step 5: Run the build**

```bash
npm run build
```

Expect a clean build.

- [ ] **Step 6: Commit**

```bash
git add lib/data/suppliers.ts app/offers/page.tsx
git rm lib/data/scoring.ts lib/data/scoring.test.ts
git commit -m "feat: back searchSuppliers/getSuppliers with real Supabase queries, retire scoring.ts"
```

---

### Task 10: Fix the `FilterPanel`/`BecomeSupplierForm` fixture-import debt

**Files:**
- Modify: `components/filter-panel.tsx`
- Modify: `components/become-supplier-form.tsx`
- Modify: every Server Component that renders either of them (find via grep in Step 1)

**Interfaces:**
- `FilterPanel` and `BecomeSupplierForm` gain a required prop `{ categories: Category[]; cities: City[] }` instead of importing the fixture arrays.

- [ ] **Step 1: Find every render site**

```bash
grep -rln "FilterPanel\|BecomeSupplierForm" app components
```

Read each result to find the exact JSX call site before editing.

- [ ] **Step 2: Update `BecomeSupplierForm`'s signature**

In `components/become-supplier-form.tsx`, remove:

```typescript
import { categories } from "@/lib/data/fixtures/categories";
import { cities } from "@/lib/data/fixtures/cities";
```

Add a `Category`/`City` type import and prop:

```typescript
import type { Category, City } from "@/lib/data/types";
```

Change the export signature from `export function BecomeSupplierForm() {` to:

```typescript
export function BecomeSupplierForm({ categories, cities }: { categories: Category[]; cities: City[] }) {
```

The function body already only reads the local `categories`/`cities` names — no other line changes.

- [ ] **Step 3: Update `FilterPanel`'s signature the same way**

Read `components/filter-panel.tsx` in full first (its current fixture-import lines weren't quoted in the design doc — confirm the exact import names before editing) and apply the same pattern: replace the fixture imports with a `{ categories, cities }` prop of the same types, keeping every other line unchanged.

- [ ] **Step 4: Update every render site to pass the props**

For each call site found in Step 1, the enclosing component must already be an `async` Server Component (both consumers are rendered from `/suppliers` and the homepage's become-supplier modal trigger — both Server Components per the existing Pass 1/2 architecture). Add, immediately before the `return`:

```typescript
const [categories, cities] = await Promise.all([getCategories(), getCities()]);
```

(adding the `getCategories`/`getCities` import from `@/lib/data/suppliers` if not already imported in that file), then pass `categories={categories} cities={cities}` on the `<FilterPanel>`/`<BecomeSupplierForm>` JSX tag. If a call site is already fetching one or both for its own use (e.g. `/suppliers` likely already calls `getCategories`/`getCities` for its own header), reuse that existing call instead of duplicating it — read the file first to check.

- [ ] **Step 5: Build and manually verify**

```bash
npm run build
```

Then restart the dev server (`taskkill //F //IM node.exe //T`, `rm -rf .next`, `npm run dev` in background) and load `/suppliers` and the homepage's "Стать поставщиком" modal — confirm the category chips and city dropdown still render with real data.

- [ ] **Step 6: Commit**

```bash
git add components/filter-panel.tsx components/become-supplier-form.tsx app/
git commit -m "fix: FilterPanel/BecomeSupplierForm receive categories/cities as props instead of importing fixtures"
```

---

### Task 11: Telegram auth — Edge Function + login UI

**Files:**
- Create Edge Function `telegram-auth` (deployed via `mcp__supabase__deploy_edge_function`, not a repo file — Supabase Edge Functions aren't part of the Next.js build).
- Create: `components/telegram-login-button.tsx`
- Modify: `app/profile/page.tsx` (currently a stub — read it first)

**Interfaces:**
- Produces: a deployed `telegram-auth` function accepting the Telegram Login Widget's callback payload (`{id, first_name, last_name?, username?, photo_url?, auth_date, hash}`) and returning `{access_token: string, refresh_token: string}` on success, `401` on a bad hash.
- `TelegramLoginButton` renders the widget script and, on successful Telegram auth, calls `telegram-auth`, then `supabase.auth.setSession(...)` with the returned tokens, then redirects to `/profile`.

- [ ] **Step 1: Set the bot token secret**

This requires a real Telegram bot token from @BotFather (manual step — see the plan's final task for the full checklist). Once you have it, set it via `mcp__supabase__execute_sql` is not the right tool for function secrets — Supabase Edge Function secrets are set through the dashboard or the `supabase secrets set` CLI, neither available via MCP tools in this environment. Flag this as a manual step for the user to complete in the Supabase dashboard (Project Settings → Edge Functions → Secrets, key `TELEGRAM_BOT_TOKEN`) before this function can work end-to-end — the function deploys and the rest of the app builds regardless, but Telegram login itself won't succeed until the secret is set.

- [ ] **Step 2: Write and deploy the `telegram-auth` function**

Call `mcp__supabase__deploy_edge_function` with `project_id: "dojevarrfczgmyxzpfbx"`, `name: "telegram-auth"`, `entrypoint_path: "index.ts"`, `verify_jwt: false` (this function is the entry point for users who have no session yet), and `files`:

```typescript
// index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyTelegramHash(payload: Record<string, string>, botToken: string): Promise<boolean> {
  const { hash, ...fields } = payload;
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.digest("SHA-256", encoder.encode(botToken));
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(dataCheckString));
  const computedHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHash === hash;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const payload = await req.json();
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    return new Response(JSON.stringify({ error: "server not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authDate = Number(payload.auth_date);
  const isFresh = Date.now() / 1000 - authDate < 86400;
  const isValid = isFresh && (await verifyTelegramHash(payload, botToken));
  if (!isValid) {
    return new Response(JSON.stringify({ error: "invalid telegram payload" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const telegramUserId = Number(payload.id);
  const email = `telegram-${telegramUserId}@gryadka.internal`;

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  let userId: string;
  if (existing) {
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { telegram_username: payload.username ?? null },
    });
  } else {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { telegram_username: payload.username ?? null },
    });
    if (createError || !created.user) {
      return new Response(JSON.stringify({ error: "failed to create user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = created.user.id;
    await admin
      .from("profiles")
      .update({
        telegram_user_id: telegramUserId,
        telegram_username: payload.username ?? null,
        display_name: [payload.first_name, payload.last_name].filter(Boolean).join(" "),
        avatar_url: payload.photo_url ?? null,
      })
      .eq("id", userId);
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || !linkData) {
    return new Response(JSON.stringify({ error: "failed to create session" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: sessionData, error: verifyError } = await anon.auth.verifyOtp({
    email,
    token: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError || !sessionData.session) {
    return new Response(JSON.stringify({ error: "failed to verify session" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
```

`profiles.telegram_user_id` is `unique`, so the lookup-by-telegram-id path is race-safe for the "already exists" branch; the synthetic `telegram-<id>@gryadka.internal` email exists only so Supabase Auth (which requires an identifier) has one — it's never displayed or emailed to anyone.

- [ ] **Step 3: Add `SUPABASE_ANON_KEY` as a function secret**

The function needs its own project's anon key at runtime (for the final `verifyOtp` call) in addition to the auto-injected `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`. This is also a dashboard/CLI-only secret-setting step — add it to the same manual checklist as `TELEGRAM_BOT_TOKEN` in Step 1.

- [ ] **Step 4: Write the login button component**

Create `components/telegram-login-button.tsx`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    onTelegramAuth: (user: Record<string, string | number>) => void;
  }
}

export function TelegramLoginButton({ botUsername }: { botUsername: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      const payload = Object.fromEntries(
        Object.entries(user).map(([key, value]) => [key, String(value)]),
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/telegram-auth`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        return;
      }

      const { access_token, refresh_token } = await response.json();
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.setSession({ access_token, refresh_token });
      router.push("/profile");
      router.refresh();
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    containerRef.current?.appendChild(script);
  }, [botUsername, router]);

  return <div ref={containerRef} />;
}
```

`botUsername` is a prop (not hardcoded) because the real bot's username isn't known until the manual @BotFather setup — the caller passes it once that's set up.

- [ ] **Step 5: Read and rewrite the `/profile` stub**

Read `app/profile/page.tsx` in full first. Replace its stub content with a Server Component that checks the session via `createServerSupabaseClient()`'s `auth.getUser()`: if no user, render `<TelegramLoginButton botUsername="TODO_SET_AFTER_BOTFATHER" />` inside the page's existing layout wrapper (keep whatever container/heading markup the stub already uses); if a user exists, fetch their `profiles` row (`display_name`, `avatar_url`) and render it with a "Выйти" button that's a small Client Component calling `supabase.auth.signOut()` then `router.push("/")`.

- [ ] **Step 6: Verify manually**

Since `TELEGRAM_BOT_TOKEN` isn't set yet (blocked on the user's @BotFather step), this can't be fully tested end-to-end in this task. Verify what can be verified without it:

```bash
npm run build
```

Expect a clean build. Confirm `/profile` renders the login button (no crash) by starting the dev server and loading `/profile` in a browser — the widget itself may not render without a valid `botUsername`, which is expected until the manual step is done.

- [ ] **Step 7: Commit**

```bash
git add components/telegram-login-button.tsx app/profile/page.tsx
git commit -m "feat: Telegram Login Widget auth (telegram-auth function + /profile login/logout)"
```

---

### Task 12: `submit-application` function + wire `BecomeSupplierForm`

**Files:**
- Create Edge Function `submit-application`.
- Modify: `components/become-supplier-form.tsx`

**Interfaces:**
- Produces: `submit-application` function, `POST` body matching the form's current fields, returns `{ ok: true }` or `{ error: string }`.

- [ ] **Step 1: Deploy the function**

`mcp__supabase__deploy_edge_function`, `project_id: "dojevarrfczgmyxzpfbx"`, `name: "submit-application"`, `verify_jwt: false` (anonymous-submittable per §38), `entrypoint_path: "index.ts"`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = await req.json();
  const required = ["companyName", "contactName", "phone", "email", "city", "categorySlugs"];
  const missing = required.filter((key) => !body[key] || (Array.isArray(body[key]) && body[key].length === 0));
  if (missing.length > 0) {
    return new Response(JSON.stringify({ error: `missing fields: ${missing.join(", ")}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: city } = await admin.from("cities").select("id").eq("slug", body.city).maybeSingle();

  const { data: inserted, error } = await admin
    .from("supplier_applications")
    .insert({
      company_name: body.companyName,
      contact_name: body.contactName,
      phone: body.phone,
      email: body.email,
      website: body.website || null,
      telegram: body.telegram || null,
      city_id: city?.id ?? null,
      category_slugs: body.categorySlugs,
      regions: body.regions || null,
      description: body.description || null,
      address: body.address || null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return new Response(JSON.stringify({ error: "failed to submit application" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await admin.from("audit_log").insert({
    entity_type: "supplier_application",
    entity_id: inserted.id,
    action: "submitted",
    new_value: body,
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

- [ ] **Step 2: Wire the form to call it**

In `components/become-supplier-form.tsx`, replace the `handleSubmit` function:

```typescript
async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  const missing = requiredFields.filter((field) => !form[field].trim());
  if (missing.length > 0 || form.categorySlugs.length === 0) {
    setError("Заполните обязательные поля и выберите хотя бы одну категорию.");
    return;
  }
  setError(null);
  setSubmitting(true);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-application`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    },
  );

  setSubmitting(false);
  if (!response.ok) {
    setError("Не удалось отправить заявку. Попробуйте еще раз.");
    return;
  }
  setSubmitted(true);
}
```

Add `const [submitting, setSubmitting] = useState(false);` next to the existing `submitted`/`error` state, and disable the submit button while `submitting` is true: change the button to `<button type="submit" disabled={submitting} ...>` with its label `{submitting ? "Отправка..." : "Отправить заявку"}`.

- [ ] **Step 3: Verify manually**

Start the dev server, open the "Стать поставщиком" modal, submit the form, then check via `mcp__supabase__execute_sql`: `select count(*) from public.supplier_applications;` — expect it to have grown by 1, and `select count(*) from public.audit_log where entity_type = 'supplier_application';` to match.

- [ ] **Step 4: Commit**

```bash
git add components/become-supplier-form.tsx
git commit -m "feat: wire Стать поставщиком form to real submission (submit-application function)"
```

---

### Task 13: «Добавить поставщика» — `submit-suggestion` function + new form

**Files:**
- Create Edge Function `submit-suggestion`.
- Create: `components/add-supplier-form.tsx`
- Modify: `app/suppliers/page.tsx` (add the entry point — read it first to find where to place a link/button matching existing layout conventions)

**Interfaces:**
- Produces: `submit-suggestion` function (requires auth — `verify_jwt: true`). `AddSupplierForm` Client Component, same login-gated pattern as the reviews form (Task 14) but simpler (no rating fields).

- [ ] **Step 1: Deploy the function**

`mcp__supabase__deploy_edge_function`, `project_id: "dojevarrfczgmyxzpfbx"`, `name: "submit-suggestion"`, `verify_jwt: true`, `entrypoint_path: "index.ts"`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization")!;
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "not authenticated" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  if (!body.name || !body.name.trim()) {
    return new Response(JSON.stringify({ error: "name is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: city } = body.city
    ? await admin.from("cities").select("id").eq("slug", body.city).maybeSingle()
    : { data: null };
  const { data: category } = body.category
    ? await admin.from("categories").select("id").eq("slug", body.category).maybeSingle()
    : { data: null };

  const { data: inserted, error } = await admin
    .from("supplier_suggestions")
    .insert({
      name: body.name,
      website: body.website || null,
      city_id: city?.id ?? null,
      category_id: category?.id ?? null,
      comment: body.comment || null,
      user_id: userData.user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return new Response(JSON.stringify({ error: "failed to submit" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await admin.from("audit_log").insert({
    actor_user_id: userData.user.id,
    entity_type: "supplier_suggestion",
    entity_id: inserted.id,
    action: "submitted",
    new_value: body,
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

- [ ] **Step 2: Write the form component**

Create `components/add-supplier-form.tsx` following the exact structural pattern of `components/become-supplier-form.tsx` (read it again for the `TextField` helper and modal-friendly styling — reuse the same `TextField` by extracting it to a shared file only if this task's diff would otherwise duplicate it verbatim; given it's an 18-line internal helper used by two sibling form components, extract it):

- [ ] **Step 2a: Extract `TextField` to a shared file**

Create `components/text-field.tsx` with the exact `TextField` function currently at the bottom of `components/become-supplier-form.tsx` (lines 138-168 as read earlier), exported as a named export. Remove it from `become-supplier-form.tsx` and import it instead: `import { TextField } from "./text-field";`.

- [ ] **Step 2b: Write `AddSupplierForm`**

```typescript
"use client";

import { useState, type FormEvent } from "react";
import { TextField } from "./text-field";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Category, City } from "@/lib/data/types";

export function AddSupplierForm({ categories, cities }: { categories: Category[]; cities: City[] }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Укажите название компании.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setSubmitting(false);
      setError("Войдите через Telegram, чтобы добавить поставщика.");
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-suggestion`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ name, website, city, category, comment }),
      },
    );

    setSubmitting(false);
    if (!response.ok) {
      setError("Не удалось отправить. Попробуйте еще раз.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="py-8 text-center font-medium">Спасибо! Мы проверим информацию и добавим поставщика.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField label="Название компании *" value={name} onChange={setName} />
      <TextField label="Сайт" value={website} onChange={setWebsite} />

      <label className="flex flex-col gap-1 text-sm">
        Город
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
        >
          <option value="">Выберите город</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Категория
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
        >
          <option value="">Выберите категорию</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </label>

      <TextField label="Комментарий" value={comment} onChange={setComment} multiline />

      {error && <p className="text-sm text-[#b3261e]">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 self-start rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        {submitting ? "Отправка..." : "Отправить"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Add the entry point on `/suppliers`**

Read `app/suppliers/page.tsx` in full to find where the existing "Стать поставщиком" trigger lives (per the design spec, it's a homepage modal — `/suppliers` doesn't have one yet). Add a text link near the top of the catalog, matching brief §30's exact copy: **"Не нашли поставщика? Добавьте его."**, that opens a modal containing `<AddSupplierForm categories={categories} cities={cities} />` — follow the same modal-open pattern already used for `BecomeSupplierSection`'s modal (`components/become-supplier-section.tsx` — read it to copy the modal shell/open-state pattern exactly, don't reinvent it).

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

Start the dev server, open `/suppliers`, click the new link, confirm the modal renders. Full submit can't be tested without a logged-in session yet (blocked on Task 11's manual Telegram setup) — verify instead that submitting while logged out shows the "Войдите через Telegram" error rather than crashing.

- [ ] **Step 5: Commit**

```bash
git add components/text-field.tsx components/become-supplier-form.tsx components/add-supplier-form.tsx app/suppliers/page.tsx
git commit -m "feat: Добавить поставщика form (submit-suggestion function + UI entry point)"
```

---

### Task 14: Reviews — `submit-review` function + reviews UI on supplier page

**Files:**
- Create Edge Function `submit-review`.
- Create: `components/review-form.tsx`
- Create: `components/reviews-list.tsx`
- Modify: `lib/data/suppliers.ts` (add `getReviews`)
- Modify: `lib/data/types.ts` (add `Review` type)
- Modify: `app/supplier/[slug]/page.tsx`

**Interfaces:**
- Produces: `getReviews(supplierSlug: string): Promise<Review[]>` (new function, same file/pattern as the others). `Review = { id: string; authorName: string; overallRating: number; priceRating?: number; qualityRating?: number; deliveryRating?: number; serviceRating?: number; comment: string; createdAt: string }`.

- [ ] **Step 1: Add the `Review` type**

In `lib/data/types.ts`, add:

```typescript
export interface Review {
  id: string;
  authorName: string;
  overallRating: number;
  priceRating?: number;
  qualityRating?: number;
  deliveryRating?: number;
  serviceRating?: number;
  comment: string;
  createdAt: string;
}
```

- [ ] **Step 2: Add `getReviews` to `lib/data/suppliers.ts`**

```typescript
export async function getReviews(supplierSlug: string): Promise<Review[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, overall_rating, price_rating, quality_rating, delivery_rating, service_rating, comment, created_at, profiles(display_name), suppliers!inner(slug)")
    .eq("suppliers.slug", supplierSlug)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    authorName: row.profiles?.display_name ?? "Пользователь",
    overallRating: row.overall_rating,
    priceRating: row.price_rating ?? undefined,
    qualityRating: row.quality_rating ?? undefined,
    deliveryRating: row.delivery_rating ?? undefined,
    serviceRating: row.service_rating ?? undefined,
    comment: row.comment,
    createdAt: row.created_at,
  }));
}
```

Add `Review` to the type import list at the top of the file.

- [ ] **Step 3: Deploy the `submit-review` function**

`mcp__supabase__deploy_edge_function`, `project_id: "dojevarrfczgmyxzpfbx"`, `name: "submit-review"`, `verify_jwt: true`, `entrypoint_path: "index.ts"`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization")!;
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "not authenticated" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const overallRating = Number(body.overallRating);
  if (!body.supplierSlug || !overallRating || overallRating < 1 || overallRating > 5 || !body.comment?.trim()) {
    return new Response(JSON.stringify({ error: "invalid review" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: supplier } = await admin
    .from("suppliers")
    .select("id")
    .eq("slug", body.supplierSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!supplier) {
    return new Response(JSON.stringify({ error: "supplier not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: inserted, error } = await admin
    .from("reviews")
    .insert({
      supplier_id: supplier.id,
      user_id: userData.user.id,
      overall_rating: overallRating,
      price_rating: body.priceRating ? Number(body.priceRating) : null,
      quality_rating: body.qualityRating ? Number(body.qualityRating) : null,
      delivery_rating: body.deliveryRating ? Number(body.deliveryRating) : null,
      service_rating: body.serviceRating ? Number(body.serviceRating) : null,
      comment: body.comment,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return new Response(JSON.stringify({ error: "failed to submit review" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await admin.from("audit_log").insert({
    actor_user_id: userData.user.id,
    entity_type: "review",
    entity_id: inserted.id,
    action: "submitted",
    new_value: body,
  });

  return new Response(
    JSON.stringify({ ok: true, message: "Отзыв отправлен и появится после проверки." }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
```

Note this inserts with `status: 'pending'`, which does **not** trigger a rating change (Task 4's trigger only recalculates on transition to/from `'published'`) — a submitted review won't affect the supplier's visible rating until a future admin action (sub-project 4) approves it. This is intentional, matching §22's "review goes through moderation before publishing."

- [ ] **Step 4: Write `ReviewForm`**

Create `components/review-form.tsx`, following the same login-gated submit pattern as `AddSupplierForm` (Task 13) but with rating inputs. Use plain `<select>` 1-5 dropdowns for each rating (no star-icon widget — matches the site's typography-first, no-decorative-element visual language from the brief):

```typescript
"use client";

import { useState, type FormEvent } from "react";
import { TextField } from "./text-field";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const ratingFields = [
  { key: "overallRating", label: "Общая оценка *" },
  { key: "priceRating", label: "Цена" },
  { key: "qualityRating", label: "Качество" },
  { key: "deliveryRating", label: "Доставка" },
  { key: "serviceRating", label: "Сервис" },
] as const;

export function ReviewForm({ supplierSlug }: { supplierSlug: string }) {
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ratings.overallRating || !comment.trim()) {
      setError("Поставьте общую оценку и напишите комментарий.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setSubmitting(false);
      setError("Войдите через Telegram, чтобы оставить отзыв.");
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ supplierSlug, comment, ...ratings }),
      },
    );

    setSubmitting(false);
    if (!response.ok) {
      setError("Не удалось отправить отзыв. Попробуйте еще раз.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="py-6 text-center font-medium">Отзыв отправлен и появится после проверки.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {ratingFields.map(({ key, label }) => (
        <label key={key} className="flex flex-col gap-1 text-sm">
          {label}
          <select
            value={ratings[key] ?? ""}
            onChange={(e) => setRatings((prev) => ({ ...prev, [key]: e.target.value }))}
            className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2"
          >
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      ))}
      <TextField label="Комментарий *" value={comment} onChange={setComment} multiline />
      {error && <p className="text-sm text-[#b3261e]">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 self-start rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        {submitting ? "Отправка..." : "Отправить отзыв"}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Write `ReviewsList`**

Create `components/reviews-list.tsx`:

```typescript
import type { Review } from "@/lib/data/types";

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-[var(--color-ink-soft)]">Пока нет отзывов.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-[var(--radius-sm)] border border-[var(--color-line)] p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">{review.authorName}</p>
            <p>★ {review.overallRating}</p>
          </div>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{review.comment}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Wire both into the supplier page**

Read `app/supplier/[slug]/page.tsx` in full. Add, after the existing offers section (matching the section-heading style already used elsewhere on the page):

```typescript
const reviews = await getReviews(supplier.slug);
```

(next to the existing `getOffers`/`getSupplierBySlug` calls), then a new section:

```jsx
<section className="mt-8">
  <h2 className="text-xl font-semibold">Отзывы</h2>
  <div className="mt-4">
    <ReviewsList reviews={reviews} />
  </div>
  <div className="mt-6 max-w-lg">
    <h3 className="mb-3 font-medium">Оставить отзыв</h3>
    <ReviewForm supplierSlug={supplier.slug} />
  </div>
</section>
```

Adjust the exact class names to match whatever section-wrapper convention the file already uses elsewhere on the page — read it first, don't assume `mt-8`/`text-xl` are the actual established pattern.

- [ ] **Step 7: Build and verify**

```bash
npm run build
npm test
```

Start the dev server, load a supplier page, confirm the reviews section renders with "Пока нет отзывов." (no published reviews exist yet — Task 4's test review was deleted).

- [ ] **Step 8: Commit**

```bash
git add lib/data/types.ts lib/data/suppliers.ts components/review-form.tsx components/reviews-list.tsx app/supplier/
git commit -m "feat: reviews section on supplier page (submit-review function + display)"
```

---

### Task 15: «Сообщить об ошибке» — `submit-error-report` function + UI

**Files:**
- Create Edge Function `submit-error-report`.
- Create: `components/error-report-button.tsx`
- Modify: `app/supplier/[slug]/page.tsx`

**Interfaces:**
- Produces: `submit-error-report` function (anonymous OK, `verify_jwt: false`). `ErrorReportButton` renders a small trigger + modal with the 6 issue-type options from §31.

- [ ] **Step 1: Deploy the function**

`mcp__supabase__deploy_edge_function`, `project_id: "dojevarrfczgmyxzpfbx"`, `name: "submit-error-report"`, `verify_jwt: false`, `entrypoint_path: "index.ts"`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const validIssueTypes = ["wrong_phone", "wrong_website", "company_closed", "wrong_address", "wrong_category", "other"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = await req.json();
  if (!body.supplierSlug || !validIssueTypes.includes(body.issueType)) {
    return new Response(JSON.stringify({ error: "invalid report" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: supplier } = await admin
    .from("suppliers")
    .select("id")
    .eq("slug", body.supplierSlug)
    .maybeSingle();
  if (!supplier) {
    return new Response(JSON.stringify({ error: "supplier not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let userId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    userId = userData.user?.id ?? null;
  }

  const { data: inserted, error } = await admin
    .from("error_reports")
    .insert({
      supplier_id: supplier.id,
      issue_type: body.issueType,
      comment: body.comment || null,
      user_id: userId,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return new Response(JSON.stringify({ error: "failed to submit" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await admin.from("audit_log").insert({
    actor_user_id: userId,
    entity_type: "error_report",
    entity_id: inserted.id,
    action: "submitted",
    new_value: body,
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

This one reads the `Authorization` header only if present (anonymous callers send none) — it's the one write path in this pass that's genuinely optional-auth rather than strictly anonymous-only or strictly login-required.

- [ ] **Step 2: Write `ErrorReportButton`**

Create `components/error-report-button.tsx`:

```typescript
"use client";

import { useState } from "react";

const issueOptions: { value: string; label: string }[] = [
  { value: "wrong_phone", label: "Неверный телефон" },
  { value: "wrong_website", label: "Неверный сайт" },
  { value: "company_closed", label: "Компания больше не работает" },
  { value: "wrong_address", label: "Неверный адрес" },
  { value: "wrong_category", label: "Неправильная категория" },
  { value: "other", label: "Другое" },
];

export function ErrorReportButton({ supplierSlug }: { supplierSlug: string }) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!issueType) return;
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-error-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierSlug, issueType, comment }),
    });
    setSubmitted(true);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-[var(--color-ink-soft)] underline"
      >
        Сообщить об ошибке
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-md)] bg-[var(--color-panel)] p-6">
            {submitted ? (
              <p className="font-medium">Спасибо, мы проверим информацию.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="font-medium">Сообщить об ошибке</h3>
                {issueOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="issueType"
                      value={opt.value}
                      checked={issueType === opt.value}
                      onChange={() => setIssueType(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Комментарий (необязательно)"
                  className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white"
                  >
                    Отправить
                  </button>
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm">
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add it to the supplier page**

In `app/supplier/[slug]/page.tsx`, add `<ErrorReportButton supplierSlug={supplier.slug} />` near the page's existing contact/CTA area (read the file to place it next to "Поделиться" per §31's "on every supplier page" instruction — it belongs with the other secondary actions, not buried in the reviews section added in Task 14).

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

Load a supplier page, click "Сообщить об ошибке", submit, then verify via `mcp__supabase__execute_sql`: `select count(*) from public.error_reports;` grew by 1.

- [ ] **Step 5: Commit**

```bash
git add components/error-report-button.tsx app/supplier/
git commit -m "feat: Сообщить об ошибке (submit-error-report function + UI)"
```

---

### Task 16: Analytics event tracking

**Files:**
- Create: `lib/analytics/track-event.ts`
- Modify: `components/promo-code-button.tsx`
- Modify: `app/supplier/[slug]/page.tsx` (website/telegram/phone click handlers — likely currently plain `<a>` tags; read first)
- Modify: `components/search-bar.tsx` (search submission)
- Modify: `components/category-card.tsx` (category click)

**Interfaces:**
- Produces: `trackEvent(input: { eventType: string; supplierId?: string; offerId?: string; promoCodeId?: string; categorySlug?: string; citySlug?: string; queryText?: string; sourcePage?: string }): void` — fire-and-forget, never throws, never blocks the UI it's called from.

- [ ] **Step 1: Write the tracking helper**

Create `lib/analytics/track-event.ts`:

```typescript
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const eventTypes = [
  "search", "view_supplier", "view_category", "view_offer",
  "click_website", "click_telegram", "click_phone", "copy_promo",
] as const;

type EventType = (typeof eventTypes)[number];

export function trackEvent(input: {
  eventType: EventType;
  supplierSlug?: string;
  queryText?: string;
  sourcePage?: string;
}): void {
  const supabase = createBrowserSupabaseClient();
  void supabase
    .from("analytics_events")
    .insert({
      event_type: input.eventType,
      query_text: input.queryText ?? null,
      source_page: input.sourcePage ?? null,
    })
    .then(() => {});
}
```

This deliberately resolves `supplier_id`/`category_id`/`city_id` as `null` for now rather than doing an extra lookup query per click — the `analytics_events` schema (Task 5) allows null on all of these, and the spec's own goal for this table is aggregate counts by `event_type`, not per-row joins from the client. If a future admin-panel report needs the FK populated, that's a `sourcePage`-string-based backfill decision for sub-project 4, not a blocker here. Simplify the signature to match: only `eventType`, `queryText`, `sourcePage` are used by any call site in this task.

- [ ] **Step 2: Wire the search bar**

Read `components/search-bar.tsx` in full. Find its submit handler (the function that runs on Enter / "Найти" click) and add, as the first line: `trackEvent({ eventType: "search", queryText: query, sourcePage: "home" });` (using whatever the actual query-state variable is named — read it first) — import `trackEvent` from `@/lib/analytics/track-event`.

- [ ] **Step 3: Wire promo code copy**

Read `components/promo-code-button.tsx` in full. In its copy-to-clipboard click handler, add `trackEvent({ eventType: "copy_promo" });` right after the clipboard write succeeds.

- [ ] **Step 4: Wire website/Telegram/phone clicks on the supplier page**

Read `app/supplier/[slug]/page.tsx`'s website/Telegram/phone links. Since these are plain anchor tags in what's likely a Server Component, and `trackEvent` needs a browser client, this requires either converting just those buttons to small Client Components or adding an `onClick` via a thin client wrapper. Add a small Client Component `components/tracked-link.tsx`:

```typescript
"use client";

import { trackEvent } from "@/lib/analytics/track-event";

export function TrackedLink({
  href,
  eventType,
  children,
  className,
}: {
  href: string;
  eventType: "click_website" | "click_telegram" | "click_phone";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      onClick={() => trackEvent({ eventType })}
      className={className}
      target={eventType === "click_phone" ? undefined : "_blank"}
      rel={eventType === "click_phone" ? undefined : "noopener noreferrer"}
    >
      {children}
    </a>
  );
}
```

Replace the three existing plain `<a>` tags on the supplier page with `<TrackedLink href={...} eventType="click_website"|"click_telegram"|"click_phone" className={...}>` keeping their exact existing `className` and children content — read the current markup first so the visual output doesn't change, only the tag name and the added tracking.

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

Start the dev server, perform a search, copy a promo code, click a supplier's website link, then verify via `mcp__supabase__execute_sql`: `select event_type, count(*) from public.analytics_events group by event_type;` shows rows for each action performed.

- [ ] **Step 6: Commit**

```bash
git add lib/analytics/track-event.ts components/promo-code-button.tsx components/search-bar.tsx components/tracked-link.tsx app/supplier/
git commit -m "feat: analytics event tracking (search, promo copy, website/telegram/phone clicks)"
```

---

### Task 17: Manual setup checklist + README

**Files:**
- Create: `docs/backend-setup.md`

**Interfaces:** none — documentation only.

- [ ] **Step 1: Write the manual setup doc**

Create `docs/backend-setup.md`:

```markdown
# Грядка — ручная настройка backend

Эти шаги нельзя выполнить автоматически — их должен сделать человек с
доступом к @BotFather и к панели Supabase.

## 1. Telegram-бот для входа

1. Открыть @BotFather в Telegram, выполнить `/newbot`, задать имя и username.
2. Выполнить `/setdomain` и указать домен, на котором будет жить сайт
   (например `gryadka.example.com`) — Telegram Login Widget работает только
   с зарегистрированным доменом.
3. Скопировать токен бота.

## 2. Secrets для Edge Function `telegram-auth`

В панели Supabase (не через MCP-инструменты — они не поддерживают secrets):
Project Settings → Edge Functions → Secrets, добавить:

- `TELEGRAM_BOT_TOKEN` — токен из шага 1.
- `SUPABASE_ANON_KEY` — anon-ключ проекта (Project Settings → API).

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` Supabase добавляет
автоматически для каждой Edge Function — их задавать не нужно.

## 3. Подставить username бота в `TelegramLoginButton`

В `app/profile/page.tsx` заменить `"TODO_SET_AFTER_BOTFATHER"` на реальный
username бота (без `@`).

## 4. Реальный Telegram-канал для промо-блока на главной

Не связано с авторизацией — кнопка на главной странице в блоке про Telegram
(`app/page.tsx`) все еще указывает на `https://t.me/gryadka` (плейсхолдер).
Заменить на реальную ссылку, когда канал будет создан.
```

- [ ] **Step 2: Commit**

```bash
git add docs/backend-setup.md
git commit -m "docs: manual backend setup checklist (Telegram bot, Edge Function secrets)"
```

---

## Explicitly deferred (not in this plan)

- Admin panel (`/admin`) — approving applications/suggestions/reviews, browsing `audit_log`, moderation queues. Sub-project 4.
- Supplier's own dashboard (editing profile/offers/news, replying to reviews). Sub-project 3.
- `complaints` table (§47) — no UI was scoped for it in the design spec's "New UI this pass adds" list; building the table with nothing to write to it would be dead schema. Add it alongside whatever sub-project first needs a "Пожаловаться" trigger point.
- `lib/data/fixtures/*` and `lib/data/fixtures/fixtures.test.ts` still exist as dead code after Task 9 for `suppliers`/`offers`, but `cities`/`categories` fixtures stay genuinely referenced: `components/offer-card.tsx`, `components/offers-filter-bar.tsx`, `components/map-filter-bar.tsx`, and `components/map-supplier-row.tsx` all import them directly for name-lookup display, the same architectural-debt pattern Task 10 fixes for `FilterPanel`/`BecomeSupplierForm`. This plan doesn't extend Task 10 to cover them because they're read-only display lookups (city/category slug → Russian name) rather than the write-form fixture dependency Task 10 was scoped around, and the values can't drift silently since Task 2/Task 1's seed data is a verbatim copy of the same fixture arrays — but it's the same category of debt and worth folding into Task 10's pattern (props from a Server Component parent instead of a direct fixture import) the next time any of those four files is touched for another reason.
- Multi-address map markers: `supplier_addresses` (Task 2) has no seed data and no admin UI to populate it yet, so `components/supplier-map.tsx` still falls back to the jittered city-center point for every supplier in practice — the schema is ready, the UI upgrade to prefer real addresses when they exist is a small follow-up once at least one supplier has one.
