import type { MetadataRoute } from "next";
import { getAllPosts } from "@/content/blog";
import { supabase } from "@/lib/supabase";
import {
  SITE_URL,
  MIN_CLUBS_INDEXABLE_CITY,
  cityToSlug,
  countryToSlug,
  fetchAllRows,
  getPlaceStats,
  isIndexableClub,
} from "@/lib/seo";

// Regenerated at most every 6 hours
export const revalidate = 21600;

// Skip corrupted names from scraped data (control chars, stray symbols)
const VALID_PLACE_NAME = /^[\p{L}\p{M}\p{N}\s\-'’´`./()]+$/u;

// Pages whose content only changes when we edit the code
const STATIC_PAGES_UPDATED = "2026-10-26";

/**
 * Only canonical, indexable, 200 URLs, with a real <lastmod>:
 * club = its updated_at, city/country = latest update of their clubs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ cities, countries, lastmod }, clubs] = await Promise.all([
    getPlaceStats(),
    fetchAllRows<{
      id: number;
      updated_at: string | null;
      website: string | null;
      instagram: string | null;
      phone: string | null;
      email: string | null;
      schedule_notes: string | null;
      drop_in_price: string | null;
    }>((from, to) =>
      supabase
        .from("clubs")
        .select("id, updated_at, website, instagram, phone, email, schedule_notes, drop_in_price")
        .order("id")
        .range(from, to)
    ),
  ]);

  const posts = getAllPosts();
  const latestPost = posts.reduce((m, p) => ((p.updated ?? p.date) > m ? p.updated ?? p.date : m), "");

  const countryEntries: MetadataRoute.Sitemap = [...countries.values()]
    .filter((c) => VALID_PLACE_NAME.test(c.name))
    .map((c) => ({
      url: `${SITE_URL}/country/${encodeURIComponent(countryToSlug(c.name))}`,
      lastModified: c.lastmod ?? undefined,
      changeFrequency: "weekly",
      priority: 0.9,
    }));

  const cityEntries: MetadataRoute.Sitemap = [...cities.values()]
    .filter((c) => c.count >= MIN_CLUBS_INDEXABLE_CITY && VALID_PLACE_NAME.test(c.name))
    .map((c) => ({
      url: `${SITE_URL}/city/${encodeURIComponent(cityToSlug(c.name))}`,
      lastModified: c.lastmod ?? undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const clubEntries: MetadataRoute.Sitemap = clubs.filter(isIndexableClub).map((club) => ({
    url: `${SITE_URL}/club/${club.id}`,
    lastModified: club.updated_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: SITE_URL, lastModified: lastmod ?? undefined, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/countries`, lastModified: lastmod ?? undefined, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: latestPost || undefined, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: STATIC_PAGES_UPDATED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: STATIC_PAGES_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updated ?? p.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...countryEntries,
    ...cityEntries,
    ...clubEntries,
  ];
}
