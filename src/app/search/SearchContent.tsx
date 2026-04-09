"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import ClubCard from "@/components/ClubCard";
import MapDynamic from "@/components/MapDynamic";
import { Club, ClubFilters } from "@/lib/types";
import { supabase } from "@/lib/supabase";

/** Haversine distance in km between two lat/lng points */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const country = searchParams.get("country") || "";
  const userLat = searchParams.get("lat");
  const userLng = searchParams.get("lng");
  const isGeoSearch = userLat != null && userLng != null;

  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [filters, setFilters] = useState<ClubFilters>({});
  const [loading, setLoading] = useState(true);
  const [hoveredClub, setHoveredClub] = useState<Club | null>(null);

  // Fetch clubs from Supabase
  useEffect(() => {
    async function fetchClubs() {
      setLoading(true);

      if (isGeoSearch) {
        // Geolocation search: fetch clubs that have coordinates
        // We fetch a broad set and sort by distance client-side
        const lat = parseFloat(userLat!);
        const lng = parseFloat(userLng!);

        // Rough bounding box (~100km) to limit results
        const latDelta = 0.9; // ~100km
        const lngDelta = 1.2; // ~100km (varies by latitude)

        const { data, error } = await supabase
          .from("clubs")
          .select("*")
          .not("lat", "is", null)
          .not("lng", "is", null)
          .gte("lat", lat - latDelta)
          .lte("lat", lat + latDelta)
          .gte("lng", lng - lngDelta)
          .lte("lng", lng + lngDelta)
          .limit(200);

        if (!error && data) {
          // Sort by distance
          const withDistance = (data as Club[])
            .map((club) => ({
              ...club,
              _distance: haversineKm(lat, lng, club.lat!, club.lng!),
            }))
            .sort((a, b) => a._distance - b._distance);

          setClubs(withDistance);
        } else {
          setClubs([]);
        }
      } else {
        // Text search
        let q = supabase.from("clubs").select("*");

        if (query && country) {
          q = q.ilike("city", query).ilike("country", country);
        } else if (query) {
          q = q.or(
            `city.ilike.%${query}%,country.ilike.%${query}%,name.ilike.%${query}%`
          );
        }

        const { data, error } = await q.limit(500);

        if (!error && data) {
          setClubs(data as Club[]);
        }
      }
      setLoading(false);
    }

    fetchClubs();
  }, [query, country, userLat, userLng, isGeoSearch]);

  // Apply filters
  useEffect(() => {
    let result = clubs;
    if (filters.gi) result = result.filter((c) => c.gi);
    if (filters.nogi) result = result.filter((c) => c.nogi);
    if (filters.open_mat) result = result.filter((c) => c.open_mat);
    if (filters.drop_in) result = result.filter((c) => c.drop_in);
    if (filters.kids_friendly) result = result.filter((c) => c.kids_friendly);
    setFilteredClubs(result);
  }, [clubs, filters]);

  // Compute map center
  const mapCenter = useCallback((): [number, number] => {
    if (isGeoSearch) {
      return [parseFloat(userLat!), parseFloat(userLng!)];
    }
    const withCoords = filteredClubs.filter(
      (c) => c.lat != null && c.lng != null
    );
    if (withCoords.length === 0) return [46.6, 2.3];
    const avgLat =
      withCoords.reduce((s, c) => s + c.lat!, 0) / withCoords.length;
    const avgLng =
      withCoords.reduce((s, c) => s + c.lng!, 0) / withCoords.length;
    return [avgLat, avgLng];
  }, [filteredClubs, isGeoSearch, userLat, userLng]);

  // Format distance for display
  const formatDistance = (club: Club & { _distance?: number }): string | null => {
    if (!club._distance) return null;
    if (club._distance < 1) return `${Math.round(club._distance * 1000)}m`;
    return `${club._distance.toFixed(1)}km`;
  };

  const headerLabel = isGeoSearch ? "Clubs near you" : query;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 bg-bg2 border-b border-bg3">
        <button
          onClick={() => router.push("/")}
          className="text-text2 text-xl cursor-pointer hover:bg-bg3 px-2 py-1 rounded transition-colors"
        >
          &larr;
        </button>
        <div className="text-lg font-extrabold tracking-tight shrink-0">
          Roll<span className="text-accent">Map</span>
        </div>
        {isGeoSearch ? (
          <div className="flex items-center gap-2 text-sm text-accent font-semibold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
            Clubs near you
          </div>
        ) : (
          <SearchBar
            defaultValue={query}
            size="md"
            className="flex-1 max-w-md"
          />
        )}
      </header>

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Results body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Club list */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 max-h-[50vh] md:max-h-[calc(100vh-130px)] md:max-w-[420px]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-text3 text-sm">
              {isGeoSearch ? "Finding nearby clubs..." : "Searching..."}
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-text2 text-sm mb-2">
                {isGeoSearch
                  ? "No clubs found nearby"
                  : `No clubs found for \u201c${query}\u201d`}
              </p>
              <p className="text-text3 text-xs">
                {isGeoSearch
                  ? "Try searching by city name instead."
                  : "Try a different city or remove filters."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-text3 text-xs px-1">
                {filteredClubs.length} club
                {filteredClubs.length > 1 ? "s" : ""} found
                {isGeoSearch ? " nearby" : ""}
              </p>
              {filteredClubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  onHover={setHoveredClub}
                  distance={formatDistance(club as Club & { _distance?: number })}
                />
              ))}
            </>
          )}
        </div>

        {/* Map */}
        <div className="h-[45vh] min-h-[250px] md:flex-1 md:h-auto md:min-h-[calc(100vh-130px)]">
          <MapDynamic
            clubs={filteredClubs}
            center={mapCenter()}
            zoom={isGeoSearch ? 12 : query ? 10 : 5}
            highlightedClub={hoveredClub}
          />
        </div>
      </div>
    </div>
  );
}
