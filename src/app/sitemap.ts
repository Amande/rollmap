import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getAllPosts } from "@/content/blog";

// Skip corrupted names from scraped data (control chars, stray symbols)
const VALID_PLACE_NAME = /^[\p{L}\p{M}\p{N}\s\-'’´`./()]+$/u;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch distinct cities and countries
  const cityEntries: MetadataRoute.Sitemap = [];
  const countryEntries: MetadataRoute.Sitemap = [];
  const citySet = new Set<string>();
  const countrySet = new Set<string>();
  let cityPage = 0;
  while (true) {
    const { data: cityData } = await supabase
      .from("clubs")
      .select("city, country")
      .not("city", "is", null)
      .order("city")
      .range(cityPage * 1000, (cityPage + 1) * 1000 - 1);
    if (!cityData || cityData.length === 0) break;
    for (const row of cityData) {
      if (row.city && VALID_PLACE_NAME.test(row.city)) citySet.add(row.city);
      if (row.country && VALID_PLACE_NAME.test(row.country)) countrySet.add(row.country);
    }
    cityPage++;
  }
  for (const city of citySet) {
    const slug = city.toLowerCase().replace(/\s+/g, "-");
    cityEntries.push({
      url: `https://rollmap.co/city/${encodeURIComponent(slug)}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  for (const country of countrySet) {
    const slug = country.toLowerCase().replace(/\s+/g, "-");
    countryEntries.push({
      url: `https://rollmap.co/country/${encodeURIComponent(slug)}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  // Fetch only "rich" clubs (with enough content to be indexable)
  // A club is rich if it has 1+ contact/info signal
  const clubEntries: MetadataRoute.Sitemap = [];
  let page = 0;

  while (true) {
    const { data } = await supabase
      .from("clubs")
      .select("id, updated_at, website, instagram, phone, email, schedule_notes, drop_in_price")
      .order("id")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (!data || data.length === 0) break;

    for (const club of data) {
      const signals = [
        !!club.website,
        !!club.instagram,
        !!club.phone,
        !!club.email,
        !!club.schedule_notes,
        !!club.drop_in_price,
      ].filter(Boolean).length;
      if (signals < 1) continue; // skip empty clubs from sitemap

      clubEntries.push({
        url: `https://rollmap.co/club/${club.id}`,
        lastModified: club.updated_at || new Date().toISOString(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    page++;
  }

  return [
    {
      url: "https://rollmap.co",
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://rollmap.co/search",
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://rollmap.co/blog",
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...getAllPosts().map((p) => ({
      url: `https://rollmap.co/blog/${p.slug}`,
      lastModified: p.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...countryEntries,
    ...cityEntries,
    ...clubEntries,
  ];
}
