"use client";

import { useState } from "react";
import { Club, ClubFilters } from "@/lib/types";
import ClubCard from "@/components/ClubCard";
import FilterBar from "@/components/FilterBar";
import MapDynamic from "@/components/MapDynamic";

interface CountryContentProps {
  clubs: Club[];
  country: string;
}

export default function CountryContent({ clubs, country }: CountryContentProps) {
  const [filters, setFilters] = useState<ClubFilters>({});
  const [hoveredClub, setHoveredClub] = useState<Club | null>(null);

  // Apply filters
  let filtered = clubs;
  if (filters.gi) filtered = filtered.filter((c) => c.gi);
  if (filters.nogi) filtered = filtered.filter((c) => c.nogi);
  if (filters.open_mat) filtered = filtered.filter((c) => c.open_mat);
  if (filters.drop_in) filtered = filtered.filter((c) => c.drop_in);
  if (filters.kids_friendly) filtered = filtered.filter((c) => c.kids_friendly);

  // Map center
  const withCoords = filtered.filter((c) => c.lat && c.lng);
  const center: [number, number] =
    withCoords.length > 0
      ? [
          withCoords.reduce((s, c) => s + c.lat!, 0) / withCoords.length,
          withCoords.reduce((s, c) => s + c.lng!, 0) / withCoords.length,
        ]
      : [20, 0];

  return (
    <>
      <FilterBar filters={filters} onChange={setFilters} />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Club list */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 max-h-[50vh] md:max-h-[calc(100vh-300px)] md:max-w-[420px]">
          <p className="text-text3 text-xs px-1">
            {filtered.length} club{filtered.length > 1 ? "s" : ""} in {country}
          </p>
          {filtered.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              onHover={setHoveredClub}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-text3 text-sm text-center py-8">
              No clubs match these filters in {country}.
            </p>
          )}
        </div>

        {/* Map */}
        <div className="h-[45vh] min-h-[250px] md:flex-1 md:h-auto md:min-h-[calc(100vh-300px)]">
          <MapDynamic
            clubs={filtered}
            center={center}
            zoom={withCoords.length > 0 ? 5 : 2}
            highlightedClub={hoveredClub}
          />
        </div>
      </div>
    </>
  );
}
