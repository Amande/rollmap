import { supabase } from "@/lib/supabase";
import { prettyName } from "@/lib/names";
import { ogCard, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "BJJ gym on RollMap";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabase
    .from("clubs")
    .select("name, city, country, verified, drop_in, drop_in_price, open_mat, gi, nogi")
    .eq("id", Number(id))
    .single();
  if (!data) return ogCard({ kicker: "BJJ gym", title: "Find a place to roll, anywhere" });

  const pills = [
    data.verified ? "Verified by the gym" : null,
    data.drop_in ? (data.drop_in_price ? `Drop-in ${data.drop_in_price}`.slice(0, 32) : "Drop-in friendly") : null,
    data.open_mat ? "Open mat" : null,
    data.gi && data.nogi ? "Gi & No-Gi" : null,
  ].filter((p): p is string => Boolean(p)).slice(0, 3);

  return ogCard({
    kicker: "BJJ gym",
    title: prettyName(data.name),
    subtitle: [data.city, data.country].filter(Boolean).join(", "),
    pills,
  });
}
