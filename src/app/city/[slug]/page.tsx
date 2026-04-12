import { supabase } from "@/lib/supabase";
import { Club } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CityContent from "./CityContent";

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

function slugToCity(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = slugToCity(slug);

  // Count clubs in this city
  const { count } = await supabase
    .from("clubs")
    .select("id", { count: "exact", head: true })
    .ilike("city", city);

  if (!count || count === 0) {
    return { title: `BJJ gyms in ${city}` };
  }

  const title = `BJJ gyms in ${city} — ${count} clubs`;
  const description = `Find ${count} Brazilian Jiu-Jitsu gyms in ${city}. Compare Gi, No-Gi, Open Mat, and Drop-in friendly clubs. Schedules, contacts, and map.`;

  return {
    title,
    description,
    openGraph: { title: `${title} | RollMap`, description, type: "website" },
    alternates: { canonical: `/city/${slug}` },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const city = slugToCity(slug);

  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .ilike("city", city)
    .order("name")
    .limit(200);

  if (error || !data || data.length === 0) {
    notFound();
  }

  const clubs = data as Club[];
  const country = clubs[0]?.country || "";

  // JSON-LD for the city page
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `BJJ gyms in ${city}`,
    description: `Brazilian Jiu-Jitsu training facilities in ${city}`,
    numberOfItems: clubs.length,
    itemListElement: clubs.slice(0, 20).map((club, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SportsActivityLocation",
        name: club.name,
        sport: "Brazilian Jiu-Jitsu",
        url: `https://rollmap.co/club/${club.id}`,
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="flex items-center gap-4 px-5 py-4 bg-bg2 border-b border-bg3">
        <Link
          href="/"
          className="text-text2 text-xl cursor-pointer hover:bg-bg3 px-2 py-1 rounded transition-colors"
        >
          &larr;
        </Link>
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          Roll<span className="text-accent">Map</span>
        </Link>
      </header>

      {/* Hero */}
      <div className="px-5 py-8 md:px-8 bg-bg2 border-b border-bg3">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
          BJJ gyms in <span className="text-accent">{city}</span>
        </h1>
        <p className="text-text2 text-sm">
          {clubs.length} Brazilian Jiu-Jitsu {clubs.length > 1 ? "clubs" : "club"}
          {country ? ` in ${city}, ${country}` : ` in ${city}`}
        </p>
      </div>

      {/* Content */}
      <main className="flex-1">
        <CityContent clubs={clubs} city={city} />
      </main>
    </div>
  );
}
