/**
 * Find and remove duplicate clubs in Supabase.
 * Duplicates = same name + same city (case-insensitive).
 * Keeps the one with the most data (lat/lng, phone, email, website).
 *
 * Usage: npx tsx src/data/dedupe-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZWd2YXZlYXVwb3F2b3ZxbW9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NTYxMSwiZXhwIjoyMDkxMjMxNjExfQ.iQOmrTtKmAzh85HdzWHlcZ6yTkt7RRn1upeiWPIyWa4";

const supabase = createClient(supabaseUrl, supabaseKey);

interface DbClub {
  id: number;
  name: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  source: string | null;
}

function dataScore(club: DbClub): number {
  let score = 0;
  if (club.lat) score += 2;
  if (club.phone) score += 1;
  if (club.email) score += 1;
  if (club.website) score += 1;
  if (club.instagram) score += 1;
  // Prefer cfjjb over ibjjf (richer data)
  if (club.source === "cfjjb") score += 3;
  return score;
}

async function main() {
  // Fetch all clubs in batches
  const allClubs: DbClub[] = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("clubs")
      .select("id, name, city, lat, lng, phone, email, website, instagram, source")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (error) {
      console.error("Fetch error:", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    allClubs.push(...(data as DbClub[]));
    page++;
  }

  console.log(`Total clubs in DB: ${allClubs.length}`);

  // Group by normalized name + city
  const groups = new Map<string, DbClub[]>();
  for (const club of allClubs) {
    const key = `${(club.name || "").toLowerCase().trim()}|||${(club.city || "").toLowerCase().trim()}`;
    const group = groups.get(key) || [];
    group.push(club);
    groups.set(key, group);
  }

  // Find duplicates
  const idsToDelete: number[] = [];
  let dupeGroups = 0;

  for (const [key, group] of groups) {
    if (group.length <= 1) continue;
    dupeGroups++;

    // Sort by data richness — keep the best
    group.sort((a, b) => dataScore(b) - dataScore(a));
    const keep = group[0];
    const remove = group.slice(1);

    if (dupeGroups <= 10) {
      console.log(`  Dupe: "${keep.name}" (${keep.city}) — keep #${keep.id} (score ${dataScore(keep)}), remove ${remove.map((r) => `#${r.id}`).join(", ")}`);
    }

    idsToDelete.push(...remove.map((r) => r.id));
  }

  console.log(`\nDuplicate groups: ${dupeGroups}`);
  console.log(`IDs to delete: ${idsToDelete.length}`);

  if (idsToDelete.length === 0) {
    console.log("No duplicates found!");
    return;
  }

  // Delete in batches of 100
  let deleted = 0;
  for (let i = 0; i < idsToDelete.length; i += 100) {
    const batch = idsToDelete.slice(i, i + 100);
    const { error } = await supabase
      .from("clubs")
      .delete()
      .in("id", batch);

    if (error) {
      console.error(`Delete error:`, error.message);
    } else {
      deleted += batch.length;
    }
  }

  console.log(`\nDeleted: ${deleted} duplicates`);
  console.log(`Remaining clubs: ${allClubs.length - deleted}`);
}

main().catch(console.error);
