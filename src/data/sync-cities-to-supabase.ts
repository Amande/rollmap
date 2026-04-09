/**
 * Sync cleaned city names from gyms_v4.json to Supabase.
 * Matches by name (case-insensitive).
 *
 * Usage: npx tsx src/data/sync-cities-to-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZWd2YXZlYXVwb3F2b3ZxbW9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NTYxMSwiZXhwIjoyMDkxMjMxNjExfQ.iQOmrTtKmAzh85HdzWHlcZ6yTkt7RRn1upeiWPIyWa4";

const DATA_PATH = resolve(__dirname, "../../../data/gyms_v4.json");

interface JsonClub {
  name: string;
  city?: string;
  [key: string]: unknown;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const allClubs: JsonClub[] = JSON.parse(readFileSync(DATA_PATH, "utf-8"));

  // Get all clubs from Supabase (batch to bypass 1000 row limit)
  const batch1 = await supabase.from("clubs").select("id, name, city").range(0, 999);
  const batch2 = await supabase.from("clubs").select("id, name, city").range(1000, 1999);

  if (batch1.error) {
    console.error("Failed to fetch:", batch1.error);
    process.exit(1);
  }

  const dbClubs = [...(batch1.data || []), ...(batch2.data || [])];

  console.log(`DB clubs: ${dbClubs.length}, JSON clubs: ${allClubs.length}`);

  let updated = 0;
  let skipped = 0;

  for (const dbClub of dbClubs) {
    const match = allClubs.find(
      (c) => c.name.toLowerCase() === dbClub.name.toLowerCase()
    );

    if (!match || !match.city) {
      skipped++;
      continue;
    }

    if (match.city === dbClub.city) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("clubs")
      .update({ city: match.city })
      .eq("id", dbClub.id);

    if (updateError) {
      console.error(`  ✗ ${dbClub.name}:`, updateError.message);
    } else {
      updated++;
    }
  }

  console.log(`\n✓ ${updated} villes mises à jour, ${skipped} inchangées`);
}

main().catch(console.error);
