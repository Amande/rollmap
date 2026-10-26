import { supabase } from "@/lib/supabase";
import { ogCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "BJJ gyms in this city on RollMap";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = decodeURIComponent(slug).replace(/-/g, "_");
  const { data } = await supabase.from("clubs").select("city, country, verified").ilike("city", pattern).limit(1000);
  const all = data ?? [];
  const counts = new Map<string, number>();
  for (const r of all) if (r.country) counts.set(r.country, (counts.get(r.country) ?? 0) + 1);
  const country = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const rows = country ? all.filter((r) => r.country === country) : all;
  const city = rows[0]?.city ?? decodeURIComponent(slug).replace(/-/g, " ");
  const verified = rows.filter((r) => r.verified).length;

  return ogCard({
    kicker: rows[0]?.country ? `BJJ gyms · ${rows[0].country}` : "BJJ gyms",
    title: `Where to train BJJ in ${city}`,
    subtitle: `${rows.length} gym${rows.length > 1 ? "s" : ""} on the map`,
    pills: verified > 0 ? [`Verified by the gym: ${verified}`] : [],
  });
}
