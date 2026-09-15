# Грядка — Backend Foundation (sub-project 1)

**Date:** 2026-09-15
**Status:** approved for planning

## Context

Грядка is a B2B directory for HoReCa businesses to find and compare suppliers.
Sub-project 2 (public site) shipped Pass 1 + Pass 2 entirely on hardcoded
fixture data in `lib/data/fixtures/*`, with query functions in
`lib/data/suppliers.ts` (`getSuppliers`, `getSupplierBySlug`, `getCategories`,
`getCities`, `getOffers`, `searchSuppliers`) deliberately shaped to mirror a
real backend's call signatures.

This spec covers sub-project 1: replacing that fixture layer with real
Supabase (Postgres + RLS + Edge Functions + Telegram auth), and wiring the
public-site forms/interactions that currently no-op (or don't exist yet) to
real writes. It reuses the infra pattern already proven on FASDELY and
BIGUNDER FM: Supabase org `nichegotakova`, a new project created in it.

Full scope for this pass (per user decision):
- Real DB behind the entire public catalog (suppliers, categories, cities,
  offers, promo codes).
- Real submission for the already-built «Стать поставщиком» onboarding form.
- A new lightweight «Добавить поставщика» form (brief §30, not built yet).
- Reviews: submission + display on the supplier page (not built yet).
- Click/view analytics per brief §54.
- Telegram Login Widget as the only auth method for this pass (phone OTP
  deferred).

Explicitly **out of scope** for this pass (belongs to later sub-projects):
admin panel UI (`/admin`, sub-project 4), supplier's own dashboard for
editing profile/offers/news/replying to reviews (Личный кабинет, sub-project
3), category subcategories/regions hierarchy, promo-code usage enforcement,
rate limiting, review edit history. The schema is designed so those can be
added without reshaping what this pass builds.

## Data model

All tables live in the `public` schema, RLS enabled on every one.

**`profiles`** — one row per `auth.users` row (same `id`), created by a
trigger on signup. `role` (`user` | `supplier` | `admin`, default `user`),
`telegram_user_id`, `telegram_username`, `display_name`, `avatar_url`,
`created_at`. `role` is only ever set by service-role code (the
`telegram-auth` function on first login) — never derived from anything the
client sends. This is a direct carry-over of a real bug fixed on FASDELY:
`role` must come from server-controlled data, not client-supplied metadata,
or any signup can self-promote to admin.

**`cities`** — `id`, `slug`, `name`, `lat`, `lng`. Direct promotion of the
existing fixture shape.

**`categories`** — `id`, `slug`, `name`, `sort_order`. Direct promotion of
the existing fixture shape. No hierarchy yet (§48's subcategories are an
admin-panel feature, added later if needed — not worth a nullable
`parent_id` column nobody reads today).

**`suppliers`** — `id`, `slug`, `name`, `short_description`, `about`,
`founded_year`, `logo_url`, `city_id` (fk), `status`
(`draft`/`pending`/`published`/`rejected`/`blocked`), `verification_level`
(`none`/`confirmed`/`verified` — the "Профиль подтвержден" / "Проверен
Грядкой" badges from §24), `rating` and `review_count` (numeric columns kept
in sync by a trigger, not computed on read), `website_url`, `telegram`,
`phone`, `min_order`, `delivery_available`, `pickup_available`,
`works_with_legal_entities`, `works_with_individual_entrepreneurs`,
`deferred_payment`, `payment_methods` (text array), `owner_user_id` (fk to
`profiles`, nullable — set when a supplier account is linked; linking itself
is sub-project 3), `created_at`, `updated_at`.

- **`supplier_categories`** (`supplier_id`, `category_id`) — many-to-many.
- **`supplier_service_cities`** (`supplier_id`, `city_id`) — the "regions of
  delivery" from the onboarding form (§9 field 9).
- **`supplier_addresses`** (`id`, `supplier_id`, `address`, `lat`, `lng`) —
  one-to-many. Real coordinates per physical location, replacing the
  documented jitter hack in `lib/data/geo.ts` (§25: "if a supplier has
  several addresses, each gets its own marker"). Suppliers with no address
  row still show a single approximate marker at their city's center — same
  fallback behavior as today, now clearly a fallback rather than the only
  option.

**`offers`** — `id`, `supplier_id`, `title`, `description`, `terms`,
`category_id` (nullable), `expires_at`, `status`
(`draft`/`pending`/`published`/`rejected`/`archived`), `created_at`. Matches
§32/§33 fields.

**`promo_codes`** — `id`, `offer_id`, `code`, `discount_description`,
`terms`, `min_order`, `starts_at`, `ends_at`, `max_uses` (informational only,
per §34's explicit rule that the platform must never claim a code was
redeemed without real integration — actual usage is only ever observed
through `analytics_events`, never enforced here).

**`reviews`** — `id`, `supplier_id`, `user_id` (fk `profiles`, required —
reviews require login per §38), `overall_rating` (1–5), `price_rating`,
`quality_rating`, `delivery_rating`, `service_rating`, `comment`, `status`
(`pending`/`published`/`hidden`/`removed`), `created_at`. No edit endpoint in
this pass — a review is immutable once submitted by its author, which
trivially satisfies §22's "no changing a review without a history" rule by
not offering changes yet. Supplier replies (§22) are a Личный кабинет
feature — the table for them doesn't exist until sub-project 3 needs it.

**`supplier_applications`** (§9, «Стать поставщиком») — the 13 fields from
the existing onboarding form, `status`
(`pending`/`approved`/`rejected`), `reviewer_note`, `created_at`. No
`user_id` — anonymous-submittable, matching that §38's registration-required
list doesn't include this form.

**`supplier_suggestions`** (§30, «Добавить поставщика») — `name`, `website`,
`city_id`, `category_id`, `comment`, `user_id` (required — this one **is** in
§38's list), `status`, `created_at`.

**`error_reports`** (§31) — `supplier_id`, `issue_type`
(`wrong_phone`/`wrong_website`/`company_closed`/`wrong_address`/
`wrong_category`/`other`), `comment`, `user_id` (nullable — anonymous OK),
`status`, `created_at`.

**`complaints`** (§47) — `target_type`
(`supplier`/`offer`/`review`/`info`), `target_id`, `reason`
(`fraud`/`not_exist`/`wrong_info`/`spam`/`violation`/`other`), `comment`,
`user_id` (nullable — anonymous OK, not in §38's list), `status`
(`open`/`closed`/`blocked`/`info_requested`), `created_at`.

**`analytics_events`** (§54) — one generic table rather than one per event
type: `event_type` (`search`/`view_supplier`/`view_category`/`view_offer`/
`click_website`/`click_telegram`/`click_phone`/`copy_promo`/`register`/
`submit_application`/`submit_suggestion`/`submit_review`/`submit_complaint`),
optional `supplier_id`/`offer_id`/`promo_code_id`/`category_id`/`city_id`,
`query_text`, `user_id` (nullable), `session_id` (anon dedup), `source_page`,
`created_at`.

**`audit_log`** (§44) — `actor_user_id` (nullable — null means system),
`actor_role`, `entity_type`, `entity_id`, `action`, `old_value`/`new_value`
(jsonb), `note`, `created_at`. Every write path below appends here, even
though the browsing UI for it is sub-project 4.

## Rating recalculation

A trigger on `reviews`, firing `AFTER INSERT OR UPDATE OF status`, recomputes
the parent supplier's `rating` (average `overall_rating` across that
supplier's `published` reviews) and `review_count` whenever a review's status
changes to or from `published`. This lives in the database, not in
application code, so it fires correctly regardless of which future
sub-project flips a review to `published` (there is no admin moderation UI
yet, so nothing calls it in this pass beyond the trigger existing and being
tested) — it can't be forgotten later the way a per-caller recalculation
would be.

## Auth

Telegram Login Widget only. A `telegram-auth` Edge Function verifies the
widget's payload hash server-side (HMAC using the bot token, which is a
function secret and never reaches the client), upserts the `profiles` row
from the verified payload (`telegram_user_id`, `telegram_username`,
`display_name`, `avatar_url`), and returns a Supabase session. The client
only ever receives a normal `authenticated` JWT — it never sets its own
`role` or `telegram_user_id`.

## Writes: Edge Functions + narrow RLS

Every write below runs through a dedicated Edge Function using the service
role, so the tables themselves need **no** client-facing `INSERT` policy —
RLS on them stays default-deny for `anon`/`authenticated`, and validation +
the matching `audit_log` entry live in one place per action:

- `telegram-auth` — described above.
- `submit-application` — «Стать поставщиком», anonymous OK.
- `submit-suggestion` — «Добавить поставщика», requires auth.
- `submit-review` — requires auth; validates the target supplier is
  `published`; inserts as `status = 'pending'`.
- `submit-error-report` — anonymous OK.
- `submit-complaint` — anonymous OK.

**One exception:** `analytics_events` gets a narrow public `INSERT`-only RLS
policy instead of a function. It's pure additive telemetry with no
validation logic and the highest call frequency of anything here (fires on
searches, card opens, every tracked click) — routing it through a function
adds latency for no benefit. No `SELECT`/`UPDATE`/`DELETE` policy exists for
it under any role except service role, so this doesn't widen what a client
can read back or tamper with.

**Reads** (suppliers, categories, cities, offers, promo codes, published
reviews) go straight through PostgREST with `SELECT` policies scoped to
`status = 'published'` for `suppliers`/`offers` and `status = 'published'`
for `reviews` — no Edge Function needed, this is exactly what RLS is for.

## Frontend integration

`lib/data/suppliers.ts`'s exported functions (`getSuppliers`,
`getSupplierBySlug`, `getCategories`, `getCities`, `getOffers`,
`searchSuppliers`) keep their exact current signatures and return shapes —
only their internals change, from filtering an in-memory array to
`supabase.from(...).select(...)` calls. No call site in `app/**` changes.

`searchSuppliers`'s scoring logic (including the fix that matches Russian
city/category display names, not just English slugs — a real bug found
during Pass 1's final review) moves server-side as a Postgres query joining
`suppliers`/`categories`/`cities` rather than the current client-side
`scoreSupplier` array scan, preserving the same matching behavior.

**Known debt this pass fixes:** `FilterPanel` and `BecomeSupplierForm` are
Client Components that currently import the `categories`/`cities` fixture
arrays directly, bypassing the query-function layer entirely — flagged as
architectural debt in the Pass 1 spec. Both switch to receiving
`categories`/`cities` as props from their parent Server Component (which
already fetches them via `getCategories`/`getCities`), matching the pattern
the rest of the app already uses instead of introducing a second
client-side data-fetching path.

**New UI this pass adds** (none of it exists yet):
- A Telegram Login Widget entry point (header "Профиль" area / `/profile`
  stub), and a minimal authenticated profile view (name, avatar, logout) —
  just enough to support the write paths that require login. The fuller
  profile view from §39 (saved searches, "my reviews", "my applications")
  is not built this pass.
- A reviews section on `/supplier/[slug]`: list of published reviews with
  sub-ratings, and a "Оставить отзыв" form gated behind login.
- A lightweight «Добавить поставщика» form/modal (§30), linked from
  `/suppliers` and nav, gated behind login.
- «Сообщить об ошибке» (§31) entry point on the supplier page — no login
  required.

**Map upgrade:** `components/supplier-map.tsx` renders one marker per
`supplier_addresses` row when they exist, falling back to the existing
jittered city-center point (`lib/data/geo.ts`) only for suppliers with no
address on file.

**Analytics capture points, this pass:** search submissions,
website/Telegram/phone clicks, and promo-code copy — each fires a direct
`analytics_events` insert per the RLS exception, not an Edge Function call.
These are the highest-signal conversion events the brief calls out
repeatedly (§14, §16, §34) and the ones a client-side fire-and-forget insert
covers cleanly. View-only events (supplier/category/offer page opens) and
write-confirmation events (successful login, every form submission) are
schema-ready (`analytics_events.event_type` accepts all of them) but not
wired to a UI trigger in this pass — there's no admin dashboard yet to
consume them (sub-project 4), so instrumenting every page view now would be
effort spent before there's a reader for the data.

## Testing

- Vitest unit tests for the new `lib/data/suppliers.ts` internals against a
  local Supabase instance (via the Supabase CLI's local stack), covering the
  same filter/sort/search cases the current fixture-based tests cover today.
- RLS verified directly with SQL (`set role anon` / `set role authenticated`
  probes) for: public tables readable by anon, non-published rows hidden
  from anon, no direct client insert possible on any Edge-Function-owned
  table, `analytics_events` insert-only with no read-back.
- Edge Functions tested via curl against the deployed dev functions
  (matching the established verification rhythm from FASDELY/BIGUNDER FM),
  including a negative test that an unverified/tampered Telegram payload is
  rejected by `telegram-auth`.

## Manual setup blocked on the user

- A real Telegram bot must exist (via @BotFather) with its domain registered
  for the Login Widget, and the bot token set as a secret on the
  `telegram-auth` function — same category of manual step as FASDELY's and
  BIGUNDER FM's bot setup.
- The real Telegram channel handle for the homepage promo section (already
  tracked as pending from Pass 2 — unrelated to auth, just resurfaced here
  since it's the same "Telegram" surface).
