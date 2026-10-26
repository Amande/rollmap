import { supabase } from "./supabase";

export const SITE_URL = "https://rollmap.co";

/** City pages with fewer clubs are noindex and left out of the sitemap (thin content). */
export const MIN_CLUBS_INDEXABLE_CITY = 2;

/** Supabase caps a query at 1,000 rows: page through the whole result. */
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

export function cityToSlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, "-");
}

export function countryToSlug(country: string): string {
  return country.toLowerCase().replace(/\s+/g, "-");
}

type ClubSignals = {
  website?: string | null;
  instagram?: string | null;
  phone?: string | null;
  email?: string | null;
  schedule_notes?: string | null;
  drop_in_price?: string | null;
};

/** A club page is worth indexing when it has at least one contact/info signal beyond name + address. */
export function isIndexableClub(club: ClubSignals): boolean {
  return Boolean(club.website || club.instagram || club.phone || club.email || club.schedule_notes || club.drop_in_price);
}

const KEEP_UPPER = new Set(["BJJ", "JJB", "MMA", "GB", "ATT", "SBG", "UFC", "RNK", "USA", "UK", "NYC", "LA", "SSF", "CT", "PS", "II", "III"]);

/** "B9 PARIS" -> "B9 Paris": federation data is often all caps. Mixed-case names are kept as is. */
export function prettyName(name: string): string {
  const trimmed = name.trim();
  if (trimmed !== trimmed.toUpperCase() || !/[A-Z]/.test(trimmed)) return trimmed;
  return trimmed
    .split(/\s+/)
    .map((word) => {
      const core = word.replace(/[^A-Za-z0-9]/g, "");
      if (KEEP_UPPER.has(core) || /\d/.test(core)) return word;
      return word
        .split("-")
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join("-");
    })
    .join(" ");
}

/** Keep the full <title> (with " | RollMap") under ~60 characters. */
export function clubTitle(name: string, city?: string | null): string {
  const n = prettyName(name);
  const max = 50;
  if (city && `${n} — BJJ in ${city}`.length <= max) return `${n} — BJJ in ${city}`;
  if (city && `${n} — ${city}`.length <= max) return `${n} — ${city}`;
  return n.length <= max ? n : `${n.slice(0, max - 1).trimEnd()}…`;
}

export type PlaceStats = {
  cities: Map<string, { name: string; country: string; count: number; lastmod: string | null }>;
  countries: Map<string, { name: string; count: number; cities: number; lastmod: string | null }>;
  lastmod: string | null;
};

/** Club counts and last update per city and country, from the whole table. */
export async function getPlaceStats(): Promise<PlaceStats> {
  const rows = await fetchAllRows<{ city: string | null; country: string | null; updated_at: string | null }>(
    (from, to) => supabase.from("clubs").select("city, country, updated_at").order("id").range(from, to)
  );
  const cities: PlaceStats["cities"] = new Map();
  const countries: PlaceStats["countries"] = new Map();
  const later = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);
  let lastmod: string | null = null;

  for (const row of rows) {
    lastmod = later(lastmod, row.updated_at);
    if (row.country) {
      const key = row.country.toLowerCase();
      const c = countries.get(key) ?? { name: row.country, count: 0, cities: 0, lastmod: null };
      c.count++;
      c.lastmod = later(c.lastmod, row.updated_at);
      countries.set(key, c);
    }
    if (row.city) {
      const key = row.city.toLowerCase();
      const c = cities.get(key) ?? { name: row.city, country: row.country ?? "", count: 0, lastmod: null };
      c.count++;
      c.lastmod = later(c.lastmod, row.updated_at);
      cities.set(key, c);
    }
  }
  const citiesPerCountry = new Map<string, number>();
  for (const c of cities.values()) {
    const key = c.country.toLowerCase();
    citiesPerCountry.set(key, (citiesPerCountry.get(key) ?? 0) + 1);
  }
  for (const [key, c] of countries) c.cities = citiesPerCountry.get(key) ?? 0;
  return { cities, countries, lastmod };
}
