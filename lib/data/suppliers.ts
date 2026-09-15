import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { Supplier, Category, City, Offer, SupplierFilters, SearchResult, Review } from "./types";

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
  cities!city_id(slug),
  supplier_categories(categories(slug)),
  supplier_service_cities(cities(slug))
`;

export async function getSuppliers(filters: SupplierFilters = {}): Promise<Supplier[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select(SUPPLIER_SELECT)
    .eq("status", "published")
    .returns<SupplierRow[]>();
  if (error) throw error;

  let result = data.map(mapSupplierRow);

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

export async function getSupplierBySlug(slug: string): Promise<Supplier | null> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select(SUPPLIER_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()
    .returns<SupplierRow | null>();
  if (error) throw error;
  return data ? mapSupplierRow(data) : null;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name")
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getCities(): Promise<City[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("cities")
    .select("slug, name, lat, lng")
    .order("name");
  if (error) throw error;
  return data;
}

type OfferRow = {
  id: string;
  title: string;
  description: string;
  expires_at: string | null;
  categories: { slug: string } | null;
  suppliers: { slug: string; cities: { slug: string } };
  promo_codes: { code: string }[];
};

export async function getOffers(supplierSlug?: string): Promise<Offer[]> {
  const supabase = createSupabasePublicClient();
  let query = supabase
    .from("offers")
    .select("id, title, description, expires_at, categories(slug), suppliers!inner(slug, cities!city_id(slug)), promo_codes(code)")
    .eq("status", "published");

  if (supplierSlug) {
    query = query.eq("suppliers.slug", supplierSlug);
  }

  const { data, error } = await query.returns<OfferRow[]>();
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

async function filterByQuery(candidates: Supplier[], query: string): Promise<Supplier[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const supabase = createSupabasePublicClient();
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

export async function searchSuppliers(query: string): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return { companies: [], categories: [], cities: [] };

  const supabase = createSupabasePublicClient();
  const { data: allPublished, error } = await supabase
    .from("suppliers")
    .select(SUPPLIER_SELECT)
    .eq("status", "published")
    .returns<SupplierRow[]>();
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

type ReviewRow = {
  id: string;
  overall_rating: number;
  price_rating: number | null;
  quality_rating: number | null;
  delivery_rating: number | null;
  service_rating: number | null;
  comment: string;
  created_at: string;
  profiles: { display_name: string | null } | null;
  suppliers: { slug: string };
};

export async function getReviews(supplierSlug: string): Promise<Review[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, overall_rating, price_rating, quality_rating, delivery_rating, service_rating, comment, created_at, profiles(display_name), suppliers!inner(slug)")
    .eq("suppliers.slug", supplierSlug)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .returns<ReviewRow[]>();
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    authorName: row.profiles?.display_name || "Пользователь",
    overallRating: row.overall_rating,
    priceRating: row.price_rating ?? undefined,
    qualityRating: row.quality_rating ?? undefined,
    deliveryRating: row.delivery_rating ?? undefined,
    serviceRating: row.service_rating ?? undefined,
    comment: row.comment,
    createdAt: row.created_at,
  }));
}
