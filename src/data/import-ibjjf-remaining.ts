/**
 * Import remaining IBJJF clubs that failed due to Unicode issues.
 * Checks which clubs are already in Supabase by name, inserts only missing ones.
 *
 * Usage: npx tsx src/data/import-ibjjf-remaining.ts
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

async function main() {
  const dataPath = resolve(__dirname, "../../../data/gyms_v5.json");
  const raw = JSON.parse(readFileSync(dataPath, "utf-8"));
  const ibjjfClubs = raw.filter((c: { source?: string }) => c.source === "ibjjf");

  console.log(`IBJJF clubs in JSON: ${ibjjfClubs.length}`);

  // Get all IBJJF club names already in Supabase
  const existingNames = new Set<string>();
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("clubs")
      .select("name")
      .eq("source", "ibjjf")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (error) {
      console.error("Fetch error:", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    data.forEach((d) => existingNames.add(d.name.toLowerCase()));
    page++;
  }

  console.log(`IBJJF clubs already in Supabase: ${existingNames.size}`);

  // Find missing clubs
  const missing = ibjjfClubs.filter(
    (c: { name: string }) => !existingNames.has(c.name.trim().toLowerCase())
  );

  console.log(`Missing clubs to import: ${missing.length}`);

  if (missing.length === 0) {
    console.log("Nothing to import!");
    return;
  }

  const rows = missing.map((club: Record<string, unknown>) => ({
    name: (club.name as string).trim(),
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

  // Insert one by one to skip problematic records
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const { error } = await supabase.from("clubs").insert([rows[i]]);
    if (error) {
      errors++;
      console.error(`  ✗ "${rows[i].name}": ${error.message}`);
    } else {
      inserted++;
    }
    if ((i + 1) % 100 === 0) {
      console.log(`  Progress: ${i + 1}/${rows.length} (${inserted} ok, ${errors} errors)`);
    }
  }

  console.log(`\nDone! ${inserted} inserted, ${errors} errors`);
}

main().catch(console.error);
