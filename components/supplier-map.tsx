"use client";

import { useEffect, useRef } from "react";
import { MapLibreMap, NavigationControl, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Supplier, City } from "@/lib/data/types";
import { supplierLocation } from "@/lib/data/geo";

// Roughly European Russia + Siberia — wide enough to cover every seeded
// city, tight enough that panning can't drift into an empty world map.
// MapLibre bounds are [[west, south], [east, north]] in [lng, lat] order.
const russiaBounds: [[number, number], [number, number]] = [
  [18, 38],
  [100, 72],
];

export function SupplierMap({
  suppliers,
  cities,
  focusCenter,
}: {
  suppliers: Supplier[];
  cities: City[];
  focusCenter: [number, number] | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: focusCenter ? [focusCenter[1], focusCenter[0]] : [55, 56.5],
      zoom: focusCenter ? 11 : 2.5,
      minZoom: 2,
      maxBounds: russiaBounds,
    });
    map.addControl(new NavigationControl(), "top-right");
    map.on("load", () => {
      map.setProjection({ type: "globe" });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Only ever constructed once — focusCenter changes are handled by the
    // separate flyTo effect below, not by tearing down and rebuilding the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];

    const points = suppliers
      .map((supplier) => ({ supplier, location: supplierLocation(supplier, cities) }))
      .filter((p): p is { supplier: Supplier; location: { lat: number; lng: number } } =>
        Boolean(p.location),
      );

    for (const { supplier, location } of points) {
      const popupHtml = `
        <div style="min-width:200px;display:flex;flex-direction:column;gap:4px;">
          <p style="font-weight:600;margin:0;">${escapeHtml(supplier.name)}</p>
          <p style="font-size:13px;color:#6b6f68;margin:0;">★ ${supplier.rating.toFixed(1)}</p>
          <a href="/supplier/${supplier.slug}" style="margin-top:4px;font-size:13px;font-weight:500;color:#3c673a;text-decoration:underline;">Открыть</a>
        </div>
      `;
      const marker = new Marker({ color: "#3c673a" })
        .setLngLat([location.lng, location.lat])
        .setPopup(new Popup({ offset: 24 }).setHTML(popupHtml))
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [suppliers, cities]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusCenter) return;
    map.flyTo({ center: [focusCenter[1], focusCenter[0]], zoom: 11 });
  }, [focusCenter]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
