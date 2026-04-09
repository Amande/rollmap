/**
 * Geocode script — enrichit gyms_v4.json avec lat/lng via Nominatim (OpenStreetMap)
 * puis met à jour Supabase.
 *
 * Usage:
 *   npx tsx src/data/geocode-clubs.ts
 *
 * Contraintes Nominatim :
 *   - 1 requête/seconde max → delay de 1.1s entre chaque appel
 *   - User-Agent requis
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../../.env.local") });

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const DATA_PATH = resolve(__dirname, "../../../data/gyms_v4.json");
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "RollMap/1.0";
const DELAY_MS = 1100;

interface Club {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  [key: string]: unknown;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) {
      console.error(`  HTTP ${res.status} for query: ${query}`);
      return null;
    }

    const results: NominatimResult[] = await res.json();
    if (results.length === 0) return null;

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };
  } catch (err) {
    console.error(`  Fetch error for query "${query}":`, err);
    return null;
  }
}

async function main() {
  // Validate env
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Load data
  const clubs: Club[] = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  const toGeocode = clubs.filter((c) => !c.lat || !c.lng);
  const total = toGeocode.length;

  console.log(`Total clubs: ${clubs.length}`);
  console.log(`Already geocoded: ${clubs.length - total}`);
  console.log(`To geocode: ${total}`);
  console.log(`Estimated time: ~${Math.ceil((total * DELAY_MS) / 60000)} minutes\n`);

  let geocoded = 0;
  let failed = 0;
  const supabaseUpdates: { id: string; lat: number; lng: number }[] = [];

  for (let i = 0; i < toGeocode.length; i++) {
    const club = toGeocode[i];
    const progress = `[${i + 1}/${total}]`;

    // Build query strings
    const fullQuery = [club.address, club.city, club.country]
      .filter(Boolean)
      .join(", ");
    const fallbackQuery = [club.city, club.country].filter(Boolean).join(", ");

    let coords: { lat: number; lng: number } | null = null;
    let usedQuery = "";

    // Try full address first (if address exists), then city+country fallback
    if (club.address && club.address.trim().length > 0) {
      usedQuery = fullQuery;
      coords = await geocode(fullQuery);
      await sleep(DELAY_MS);
    }

    if (!coords && fallbackQuery.trim().length > 0) {
      if (usedQuery) {
        // Already used one slot, need another delay before second call
        usedQuery = fallbackQuery;
        coords = await geocode(fallbackQuery);
        await sleep(DELAY_MS);
      } else {
        usedQuery = fallbackQuery;
        coords = await geocode(fallbackQuery);
        await sleep(DELAY_MS);
      }
    }

    if (coords) {
      // Update in-memory data
      const clubIndex = clubs.findIndex((c) => c.id === club.id);
      if (clubIndex !== -1) {
        clubs[clubIndex].lat = coords.lat;
        clubs[clubIndex].lng = coords.lng;
      }
      supabaseUpdates.push({ id: club.id, lat: coords.lat, lng: coords.lng });
      geocoded++;
      console.log(`${progress} ✓ ${club.name} (${club.city}, ${club.country}) → ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
    } else {
      failed++;
      console.log(`${progress} ✗ ${club.name} (${club.city}, ${club.country}) — not found`);
    }

    // Save JSON every 50 clubs to avoid losing progress on interruption
    if ((i + 1) % 50 === 0) {
      writeFileSync(DATA_PATH, JSON.stringify(clubs, null, 2), "utf-8");
      console.log(`\n  → Saved progress to gyms_v4.json (${geocoded} geocoded so far)\n`);
    }
  }

  // Final JSON save
  writeFileSync(DATA_PATH, JSON.stringify(clubs, null, 2), "utf-8");
  console.log(`\n✓ gyms_v4.json updated with all coordinates.`);

  // Update Supabase
  if (supabaseUpdates.length === 0) {
    console.log("No clubs to update in Supabase.");
    return;
  }

  console.log(`\nUpdating ${supabaseUpdates.length} clubs in Supabase...`);

  let dbUpdated = 0;
  let dbErrors = 0;

  for (const update of supabaseUpdates) {
    const { error } = await supabase
      .from("clubs")
      .update({ lat: update.lat, lng: update.lng })
      .eq("id", update.id);

    if (error) {
      // id column may not exist — try matching by name+city
      dbErrors++;
    } else {
      dbUpdated++;
    }
  }

  // If id-based updates failed, try name-based bulk approach
  if (dbErrors > 0 && dbUpdated === 0) {
    console.log("id-based update failed. Trying name+city matching...");
    dbUpdated = 0;
    dbErrors = 0;

    for (const update of supabaseUpdates) {
      const club = clubs.find((c) => c.id === update.id);
      if (!club) continue;

      const { error } = await supabase
        .from("clubs")
        .update({ lat: update.lat, lng: update.lng })
        .eq("name", club.name)
        .eq("city", club.city || "");

      if (error) {
        dbErrors++;
      } else {
        dbUpdated++;
      }
    }
  }

  console.log(`Supabase: ${dbUpdated} updated, ${dbErrors} errors.`);

  // Trigger PostGIS location column update
  console.log("\nUpdating PostGIS location column...");
  const { error: rpcError } = await supabase.rpc("exec_sql", {
    query: `
      UPDATE clubs
      SET location = ST_MakePoint(lng, lat)::geography
      WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;
    `,
  });

  if (rpcError) {
    console.log(
      "Note: PostGIS auto-update via RPC failed. Run this SQL manually in Supabase:\n"
    );
    console.log(
      "  UPDATE clubs SET location = ST_MakePoint(lng, lat)::geography WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;"
    );
  } else {
    console.log("PostGIS location column updated.");
  }

  // Final summary
  console.log("\n=== RÉSUMÉ FINAL ===");
  console.log(`Total à géocoder : ${total}`);
  console.log(`Géocodés avec succès : ${geocoded}`);
  console.log(`Échecs : ${failed}`);
  console.log(`Taux de succès : ${((geocoded / total) * 100).toFixed(1)}%`);
  console.log(`Supabase mis à jour : ${dbUpdated}`);
}

main().catch(console.error);
