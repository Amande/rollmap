/**
 * Sync lat/lng from gyms_v4.json to Supabase.
 * Matches by name (case-insensitive) since JSON ids != Supabase ids.
 *
 * Usage: npx tsx src/data/sync-coords-to-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZWd2YXZlYXVwb3F2b3ZxbW9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NTYxMSwiZXhwIjoyMDkxMjMxNjExfQ.iQOmrTtKmAzh85HdzWHlcZ6yTkt7RRn1upeiWPIyWa4";

const DATA_PATH = resolve(__dirname, "../../../data/gyms_v4.json");

interface JsonClub {
  name: string;
  city?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Load JSON data — only clubs with coords
  const allClubs: JsonClub[] = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  const withCoords = allClubs.filter((c) => c.lat && c.lng);

  console.log(`Clubs with coords in JSON: ${withCoords.length}`);

  // Get all clubs from Supabase that have null lat/lng
  const { data: dbClubs, error } = await supabase
    .from("clubs")
    .select("id, name, city, country, lat, lng")
    .is("lat", null)
    .limit(1000);

  if (error) {
    console.error("Failed to fetch clubs from Supabase:", error);
    process.exit(1);
  }

  console.log(`Clubs with null lat/lng in Supabase: ${dbClubs?.length || 0}`);

  if (!dbClubs || dbClubs.length === 0) {
    console.log("Nothing to update!");
    return;
  }

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const dbClub of dbClubs) {
    // Find matching club in JSON by name (case-insensitive)
    const match = withCoords.find(
      (c) => c.name.toLowerCase() === dbClub.name.toLowerCase()
    );

    if (!match) {
      notFound++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("clubs")
      .update({ lat: match.lat, lng: match.lng })
      .eq("id", dbClub.id);

    if (updateError) {
      errors++;
      console.error(`  ✗ Failed to update ${dbClub.name}:`, updateError.message);
    } else {
      updated++;
      if (updated % 50 === 0) {
        console.log(`  Updated ${updated}...`);
      }
    }
  }

  console.log(`\n=== RÉSULTAT ===`);
  console.log(`Mis à jour : ${updated}`);
  console.log(`Non trouvés dans JSON : ${notFound}`);
  console.log(`Erreurs : ${errors}`);
}

main().catch(console.error);
