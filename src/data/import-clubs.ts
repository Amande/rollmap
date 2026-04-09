/**
 * Import script — loads gyms_v4.json into Supabase
 *
 * Usage:
 *   npx tsx src/data/import-clubs.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (or set SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY for write access)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load env from .env.local
import { config } from "dotenv";
config({ path: resolve(__dirname, "../../.env.local") });

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface RawClub {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  website?: string;
  instagram?: string;
  phone?: string;
  email?: string;
  nb_licencies?: string;
  drop_in?: boolean | null;
  gi?: boolean | null;
  nogi?: boolean | null;
  open_mat?: boolean | null;
  source?: string;
  source_url?: string;
}

async function main() {
  const dataPath = resolve(__dirname, "../../../data/gyms_v4.json");
  console.log(`Reading data from: ${dataPath}`);

  const raw: RawClub[] = JSON.parse(readFileSync(dataPath, "utf-8"));
  console.log(`Loaded ${raw.length} clubs from JSON.`);

  // Transform to DB rows
  const rows = raw.map((club) => ({
    name: club.name,
    address: club.address || null,
    city: club.city || null,
    country: club.country || "France",
    lat: club.lat || null,
    lng: club.lng || null,
    website: club.website || null,
    instagram: club.instagram || null,
    phone: club.phone || null,
    email: club.email || null,
    nb_licencies: club.nb_licencies || null,
    drop_in: club.drop_in ?? null,
    gi: club.gi ?? null,
    nogi: club.nogi ?? null,
    open_mat: club.open_mat ?? null,
    source: club.source || null,
    source_url: club.source_url || null,
    verified: false,
  }));

  // Insert in batches of 100
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("clubs").insert(batch);

    if (error) {
      console.error(
        `Error inserting batch ${i / BATCH_SIZE + 1}:`,
        error.message
      );
      errors++;
    } else {
      inserted += batch.length;
      console.log(
        `Inserted batch ${i / BATCH_SIZE + 1} (${inserted}/${rows.length})`
      );
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Errors: ${errors}`);

  // Now update the PostGIS location column for rows with lat/lng
  console.log("\nUpdating PostGIS location column...");
  const { error: updateError } = await supabase.rpc("exec_sql", {
    query: `
      UPDATE clubs
      SET location = ST_MakePoint(lng, lat)::geography
      WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;
    `,
  });

  if (updateError) {
    console.log(
      "Note: Could not auto-update location column via RPC.",
      "Run this SQL manually in Supabase SQL editor:"
    );
    console.log(`
      UPDATE clubs
      SET location = ST_MakePoint(lng, lat)::geography
      WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;
    `);
  } else {
    console.log("PostGIS location column updated successfully.");
  }
}

main().catch(console.error);
