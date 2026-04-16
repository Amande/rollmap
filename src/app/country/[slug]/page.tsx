import { supabase } from "@/lib/supabase";
import { Club } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CountryContent from "./CountryContent";

interface CountryPageProps {
  params: Promise<{ slug: string }>;
}

function slugToCountry(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function countryToSlug(country: string): string {
  return country.toLowerCase().replace(/\s+/g, "-");
}

export async function generateMetadata({
  params,
}: CountryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = slugToCountry(slug);

  const { count } = await supabase
    .from("clubs")
    .select("id", { count: "exact", head: true })
    .ilike("country", country);

  if (!count || count === 0) {
    return { title: `BJJ gyms in ${country}` };
  }

  const title = `BJJ gyms in ${country} — ${count} clubs`;
  const description = `Find ${count} Brazilian Jiu-Jitsu gyms in ${country}. Search by city, filter by Gi, No-Gi, Open Mat, Drop-in friendly. Map, schedules, and contacts.`;

  return {
    title,
    description,
    openGraph: { title: `${title} | RollMap`, description, type: "website" },
    alternates: { canonical: `/country/${slug}` },
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { slug } = await params;
  const country = slugToCountry(slug);

  // Get all clubs in this country
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .ilike("country", country)
    .order("city")
    .order("name");

  if (error || !data || data.length === 0) {
    notFound();
  }

  const clubs = data as Club[];

  // Group cities with counts for internal linking
  const cityCounts: Record<string, number> = {};
  for (const club of clubs) {
    if (club.city) {
      cityCounts[club.city] = (cityCounts[club.city] || 0) + 1;
    }
  }
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  // Breadcrumb JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://rollmap.co" },
      { "@type": "ListItem", position: 2, name: country },
    ],
  };

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `BJJ gyms in ${country}`,
    description: `Brazilian Jiu-Jitsu training facilities in ${country}`,
    numberOfItems: clubs.length,
    itemListElement: topCities.map(([city, count], i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Place",
        name: `${city} — ${count} BJJ clubs`,
        url: `https://rollmap.co/city/${city.toLowerCase().replace(/\s+/g, "-")}`,
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
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
          BJJ gyms in <span className="text-accent">{country}</span>
        </h1>
        <p className="text-text2 text-sm">
          {clubs.length} Brazilian Jiu-Jitsu {clubs.length > 1 ? "clubs" : "club"} across{" "}
          {Object.keys(cityCounts).length} cities
        </p>
      </div>

      {/* Cities grid — internal links */}
      {topCities.length > 0 && (
        <div className="px-5 py-6 md:px-8 bg-bg border-b border-bg3">
          <h2 className="text-sm font-bold text-text2 uppercase tracking-widest mb-3">
            Top cities
          </h2>
          <div className="flex gap-2 flex-wrap">
            {topCities.map(([city, count]) => (
              <Link
                key={city}
                href={`/city/${city.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-3 py-1.5 bg-bg2 border border-bg3 rounded-full text-xs font-semibold text-text2 hover:text-accent hover:border-accent transition-colors"
              >
                {city} ({count})
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1">
        <CountryContent clubs={clubs} country={country} />
      </main>
    </div>
  );
}
