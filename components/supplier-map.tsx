"use client";

import { useEffect, useRef } from "react";
import { MapLibreMap, NavigationControl, Marker, Popup, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { SupplierMapPoint } from "@/lib/data/types";

// MapLibre GL v6 ships as pure ESM and does not auto-bundle its Web
// Worker — without this, vector tiles are fetched but never parsed: the
// background layer and markers (plain DOM, not worker-dependent) render
// fine, giving the illusion of a working map with an empty canvas. The
// worker file (+ its sibling maplibre-gl-shared.mjs) is copied into
// public/maplibre/ verbatim from node_modules/maplibre-gl/dist/.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export function SupplierMap({
  points,
  focusCenter,
}: {
  points: SupplierMapPoint[];
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
      minZoom: 1,
    });
    map.addControl(new NavigationControl(), "top-right");
    map.on("load", () => {
      map.setProjection({ type: "globe" });
      map.resize();

      // The "liberty" style renders buildings as flat fills up to z14,
      // then switches to 3D extrusions above that — drop the 3D layer
      // and let the flat one keep covering every zoom past 14 instead.
      if (map.getLayer("building-3d")) {
        map.removeLayer("building-3d");
      }
      if (map.getLayer("building")) {
        map.setLayerZoomRange("building", 13, 24);
      }

      // Drop POI icons/labels (shops, cafes, ATMs, parking, info points,
      // etc. — every one of the "liberty" style's 4 poi_* layers) and the
      // dashed pedestrian-path lines (roads, bridges, tunnels) — visual
      // noise for a supplier directory, not information anyone needs here.
      for (const id of [
        "poi_r20",
        "poi_r7",
        "poi_r1",
        "poi_transit",
        "road_path_pedestrian",
        "tunnel_path_pedestrian",
        "bridge_path_pedestrian",
        "bridge_path_pedestrian_casing",
      ]) {
        if (map.getLayer(id)) map.removeLayer(id);
      }

      // The "liberty" style ships the housenumber source-layer in its
      // vector tiles but never renders it — add it ourselves, visible
      // only once you're zoomed in close enough for individual
      // buildings to make sense (below that it'd just be visual noise).
      if (!map.getLayer("housenumber-label")) {
        map.addLayer({
          id: "housenumber-label",
          type: "symbol",
          source: "openmaptiles",
          "source-layer": "housenumber",
          minzoom: 17,
          layout: {
            "text-field": ["get", "housenumber"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 10,
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#6b6f68",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.2,
          },
        });
      }
    });

    // MapLibre measures its container once at construction. In a flex
    // layout the container can still be mid-reflow at that instant (0
    // height, or the wrong height before the sidebar/fonts settle) — the
    // canvas then renders at the wrong size and no tiles ever appear,
    // while markers (plain positioned DOM elements, not canvas-drawn)
    // still show up fine. A ResizeObserver keeps the canvas in sync with
    // whatever size the container actually ends up at.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    mapRef.current = map;
    return () => {
      resizeObserver.disconnect();
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

    for (const point of points) {
      const addressLine = point.address
        ? `<p style="font-size:13px;color:#6b6f68;margin:4px 0 0;">${escapeHtml(
            [point.label, point.address].filter(Boolean).join(" · "),
          )}</p>`
        : "";
      const popupHtml = `
        <div style="min-width:200px;display:flex;flex-direction:column;gap:4px;">
          <p style="font-weight:600;margin:0;">${escapeHtml(point.supplierName)}</p>
          <p style="font-size:13px;color:#6b6f68;margin:0;">★ ${point.rating.toFixed(1)}</p>
          ${addressLine}
          <a href="/supplier/${point.supplierSlug}" style="margin-top:4px;font-size:13px;font-weight:500;color:#8a795d;text-decoration:underline;">Открыть профиль</a>
        </div>
      `;
      // Primary addresses (or the single fallback point for suppliers with
      // no real address on file) get the solid brand-green pin; secondary
      // addresses of the same supplier get a lighter, visually distinct pin.
      const marker = new Marker({ color: point.isPrimary ? "#8a795d" : "#c5bcae" })
        .setLngLat([point.lng, point.lat])
        .setPopup(new Popup({ offset: 24 }).setHTML(popupHtml))
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [points]);

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
