/**
 * Import NEW IBJJF clubs from gyms_v5.json into Supabase.
 * Only imports clubs with source="ibjjf" (the new ones from the merge).
 *
 * Usage: npx tsx src/data/import-ibjjf.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZWd2YXZlYXVwb3F2b3ZxbW9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NTYxMSwiZXhwIjoyMDkxMjMxNjExfQ.iQOmrTtKmAzh85HdzWHlcZ6yTkt7RRn1upeiWPIyWa4";

const supabase = createClient(supabaseUrl, supabaseKey);

interface RawClub {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  website?: string | null;
  instagram?: string | null;
  phone?: string | null;
  email?: string | null;
  gi?: boolean | null;
  nogi?: boolean | null;
  open_mat?: boolean | null;
  drop_in?: boolean | null;
  source?: string;
  source_url?: string;
}

async function main() {
  const dataPath = resolve(__dirname, "../../../data/gyms_v5.json");
  const raw: RawClub[] = JSON.parse(readFileSync(dataPath, "utf-8"));

  // Only new IBJJF clubs
  const ibjjfClubs = raw.filter((c) => c.source === "ibjjf");
  console.log(`Total clubs in gyms_v5.json: ${raw.length}`);
  console.log(`New IBJJF clubs to import: ${ibjjfClubs.length}`);

  const rows = ibjjfClubs.map((club) => ({
    name: club.name.trim(),
    address: club.address || null,
    city: club.city || null,
    country: club.country || null,
    lat: club.lat || null,
    lng: club.lng || null,
    website: club.website || null,
    instagram: null,
    phone: null,
    email: null,
    nb_licencies: null,
    drop_in: club.drop_in ?? null,
    gi: club.gi ?? null,
    nogi: club.nogi ?? null,
    open_mat: club.open_mat ?? null,
    source: "ibjjf",
    source_url: "https://ibjjf.com/registered-academies",
    verified: false,
  }));

  // Insert in batches of 200
  const BATCH_SIZE = 200;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("clubs").insert(batch);

    if (error) {
      console.error(`Error batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      errors++;
    } else {
      inserted += batch.length;
    }

    if ((i / BATCH_SIZE + 1) % 5 === 0 || i + BATCH_SIZE >= rows.length) {
      console.log(`Progress: ${inserted}/${rows.length} inserted (${errors} batch errors)`);
    }
  }

  console.log(`\nDone! ${inserted} clubs inserted, ${errors} batch errors`);
}

main().catch(console.error);
