import type { City, Supplier } from "./types";

// City-level coordinates only exist per city, not per exact address, so
// suppliers sharing a city get a small deterministic offset (derived from
// their slug) instead of stacking on the exact same point.
export function supplierLocation(
  supplier: Supplier,
  cities: City[],
): { lat: number; lng: number } | null {
  const city = cities.find((c) => c.slug === supplier.city);
  if (!city) return null;

  let hash = 0;
  for (let i = 0; i < supplier.slug.length; i++) {
    hash = supplier.slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const radius = 0.015 + (Math.abs(hash) % 10) * 0.001;

  return {
    lat: city.lat + Math.sin(angle) * radius,
    lng: city.lng + Math.cos(angle) * radius,
  };
}
