import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch distinct cities for city pages
  const cityEntries: MetadataRoute.Sitemap = [];
  const citySet = new Set<string>();
  let cityPage = 0;
  while (true) {
    const { data: cityData } = await supabase
      .from("clubs")
      .select("city")
      .not("city", "is", null)
      .order("city")
      .range(cityPage * 1000, (cityPage + 1) * 1000 - 1);
    if (!cityData || cityData.length === 0) break;
    for (const row of cityData) {
      if (row.city) citySet.add(row.city);
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

  // Fetch all club IDs in batches
  const clubEntries: MetadataRoute.Sitemap = [];
  let page = 0;

  while (true) {
    const { data } = await supabase
      .from("clubs")
      .select("id, updated_at")
      .order("id")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (!data || data.length === 0) break;

    for (const club of data) {
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
    ...cityEntries,
    ...clubEntries,
  ];
}
