"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import type { Supplier, City } from "@/lib/data/types";
import { supplierLocation } from "@/lib/data/geo";

// Leaflet's default marker icons resolve to broken paths under bundlers —
// point them at the CDN-hosted assets instead of shipping our own copies.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FlyToCity({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 11);
  }, [center, map]);
  return null;
}

export function SupplierMap({
  suppliers,
  cities,
  focusCenter,
}: {
  suppliers: Supplier[];
  cities: City[];
  focusCenter: [number, number] | null;
}) {
  const points = suppliers
    .map((supplier) => ({ supplier, location: supplierLocation(supplier, cities) }))
    .filter((p): p is { supplier: Supplier; location: { lat: number; lng: number } } =>
      Boolean(p.location),
    );

  // Roughly European Russia + Siberia — wide enough to cover every seeded
  // city, tight enough that panning can't drift into an empty world map.
  const russiaBounds: [[number, number], [number, number]] = [
    [38, 18],
    [72, 100],
  ];

  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--color-paper)] p-6">
      <div className="aspect-square h-full max-h-[720px] w-full max-w-[720px] overflow-hidden rounded-full border border-[var(--color-line)] shadow-[0_0_0_6px_var(--color-panel)]">
        <MapContainer
          center={focusCenter ?? [56.5, 55]}
          zoom={focusCenter ? 11 : 3}
          minZoom={3}
          maxBounds={russiaBounds}
          maxBoundsViscosity={1}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <FlyToCity center={focusCenter} />

          {points.map(({ supplier, location }) => (
            <Marker key={supplier.slug} position={[location.lat, location.lng]} icon={markerIcon}>
              <Popup>
                <div className="flex min-w-[200px] flex-col gap-1">
                  <p className="font-semibold text-[var(--color-ink)]">{supplier.name}</p>
                  <p className="text-sm text-[var(--color-ink-soft)]">★ {supplier.rating.toFixed(1)}</p>
                  <Link
                    href={`/supplier/${supplier.slug}`}
                    className="mt-1 text-sm font-medium text-[var(--color-accent)] underline"
                  >
                    Открыть
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
