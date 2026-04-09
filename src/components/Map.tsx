"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import { Club } from "@/lib/types";

const TILE_URLS = {
  light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
} as const;

type MapTheme = keyof typeof TILE_URLS;

// Extend L namespace for markerClusterGroup
declare module "leaflet" {
  function markerClusterGroup(options?: Record<string, unknown>): L.MarkerClusterGroup;
}

interface MapProps {
  clubs: Club[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  highlightedClub?: Club | null;
  onClubClick?: (club: Club) => void;
}

const ACCENT = "#22d3a7";

function createClubIcon(highlighted = false, theme: MapTheme = "light"): L.DivIcon {
  const size = highlighted ? 16 : 11;
  const borderColor = theme === "dark" ? "#1a1d27" : "white";
  const border = highlighted ? `3px solid ${ACCENT}` : `2px solid ${borderColor}`;
  const shadow = theme === "dark" ? "0 0 6px rgba(34,211,167,0.5)" : "0 1px 4px rgba(0,0,0,0.3)";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${ACCENT};border:${border};box-shadow:${shadow};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MapComponent({
  clubs,
  center = [30, 0],
  zoom = 2,
  className = "",
  highlightedClub,
  onClubClick,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef = useRef<any>(null);
  const markersRef = useRef<globalThis.Map<number, L.Marker>>(new globalThis.Map());
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [theme, setTheme] = useState<MapTheme>("dark");

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: false,
    });

    const tileLayer = L.tileLayer(TILE_URLS.dark, {
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when clubs change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Force Leaflet to recalculate container size (fixes stale tiles after client-side nav)
    setTimeout(() => map.invalidateSize(), 0);

    // Remove old cluster group
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });

    const newMarkers = new globalThis.Map<number, L.Marker>();

    clubs.forEach((club) => {
      if (club.lat == null || club.lng == null) return;

      const marker = L.marker([club.lat, club.lng], {
        icon: createClubIcon(false),
      });

      const popupContent = `
        <div style="min-width:180px;">
          <strong style="font-size:0.95rem;">${club.name}</strong>
          <div style="color:#9ca3b4;font-size:0.8rem;margin-top:2px;">
            ${club.city || ""}${club.country && club.country !== "France" ? ` \u2022 ${club.country}` : ""}
          </div>
          <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">
            ${club.gi ? '<span style="background:rgba(59,130,246,.15);color:#60a5fa;padding:2px 6px;border-radius:3px;font-size:0.65rem;font-weight:700;">GI</span>' : ""}
            ${club.nogi ? '<span style="background:rgba(168,85,247,.15);color:#c084fc;padding:2px 6px;border-radius:3px;font-size:0.65rem;font-weight:700;">NO-GI</span>' : ""}
          </div>
          <a href="/club/${club.id}" style="display:inline-block;margin-top:8px;color:#22d3a7;font-size:0.8rem;font-weight:600;text-decoration:none;">
            View details &rarr;
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);

      if (onClubClick) {
        marker.on("click", () => onClubClick(club));
      }

      newMarkers.set(club.id, marker);
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;
    markersRef.current = newMarkers;

    // Fit bounds to show all clubs
    const withCoords = clubs.filter((c) => c.lat != null && c.lng != null);
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(
        withCoords.map((c) => [c.lat!, c.lng!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      // No results: reset to world view
      map.setView([30, 0], 2);
    }
  }, [clubs, onClubClick]);

  // Switch tile layer on theme change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileLayerRef.current) return;

    tileLayerRef.current.setUrl(TILE_URLS[theme]);

    // Update marker icons for new theme
    markersRef.current.forEach((marker, id) => {
      const isHighlighted = highlightedClub?.id === id;
      marker.setIcon(createClubIcon(isHighlighted, theme));
    });
  }, [theme, highlightedClub]);

  // Highlight marker on hover
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const isHighlighted = highlightedClub?.id === id;
      marker.setIcon(createClubIcon(isHighlighted, theme));
      if (isHighlighted) {
        marker.setZIndexOffset(1000);
      } else {
        marker.setZIndexOffset(0);
      }
    });
  }, [highlightedClub]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <div className={`w-full h-full relative ${className}`} style={{ minHeight: "250px" }}>
      <div ref={containerRef} className="w-full h-full" />
      <button
        onClick={toggleTheme}
        className="absolute top-2.5 right-2.5 z-[500] w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
        title={theme === "light" ? "Dark map" : "Light map"}
      >
        {theme === "light" ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        )}
      </button>
    </div>
  );
}
