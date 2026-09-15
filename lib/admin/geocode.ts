export type GeocodeResult = { lat: number; lng: number } | null;

export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  if (!query.trim()) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      // Nominatim's usage policy requires a real identifying User-Agent —
      // requests without one get blocked.
      "User-Agent": "Gryadka-HoReCa-Directory/1.0 (admin address geocoding)",
    },
  });
  if (!response.ok) return null;

  const results: { lat: string; lon: string }[] = await response.json();
  if (results.length === 0) return null;

  return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
}
