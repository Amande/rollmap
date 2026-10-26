import { supabase } from "@/lib/supabase";
import { ogCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "BJJ gyms in this country on RollMap";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = decodeURIComponent(slug).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const [{ count }, { count: verified }] = await Promise.all([
    supabase.from("clubs").select("id", { count: "exact", head: true }).ilike("country", name),
    supabase.from("clubs").select("id", { count: "exact", head: true }).ilike("country", name).eq("verified", true),
  ]);

  return ogCard({
    kicker: "BJJ gyms by country",
    title: `BJJ gyms in ${name}`,
    subtitle: `${(count ?? 0).toLocaleString("en-US")} gyms, city by city`,
    pills: verified ? [`Verified by the gym: ${verified}`] : [],
  });
}
