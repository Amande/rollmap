import { supabase } from "@/lib/supabase";
import { Club } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CountryContent from "./CountryContent";
import {
  fetchAllRows,
  cityToSlug,
  isIndexableClub,
  SITE_URL,
} from "@/lib/seo";

// Rebuilt at most every 6 hours (ISR)
export const revalidate = 21600;

const FEATURED_LIMIT = 100;

interface CountryPageProps {
  params: Promise<{ slug: string }>;
}

function slugToCountry(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function getCountryClubs(slug: string): Promise<Club[]> {
  const country = slugToCountry(slug);
  return fetchAllRows<Club>((from, to) =>
    supabase.from("clubs").select("*").ilike("country", country).order("id").range(from, to)
  );
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = slugToCountry(slug);
  const { count } = await supabase
    .from("clubs")
    .select("id", { count: "exact", head: true })
    .ilike("country", country);

  if (!count) return { title: `BJJ gyms in ${country}` };

  const name = (await supabase.from("clubs").select("country").ilike("country", country).limit(1)).data?.[0]?.country ?? country;
  const title = `BJJ gyms in ${name} — ${count} clubs`;
  const description = `${count} Brazilian Jiu-Jitsu gyms in ${name}, city by city: drop-in friendly gyms, open mats, Gi & No-Gi, contacts and map.`;
  return {
    title,
    description,
    openGraph: { title: `${title} | RollMap`, description, type: "website" },
    alternates: { canonical: `/country/${slug}` },
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { slug } = await params;
  const clubs = await getCountryClubs(slug);
  if (clubs.length === 0) notFound();

  const country = clubs[0].country || slugToCountry(slug);

  // All cities with their number of clubs (internal links to every city).
  // Grouped case-insensitively like the city page ("Rio De Janeiro" = "Rio de Janeiro").
  const cityGroups = new Map<string, { names: Map<string, number>; count: number }>();
  for (const club of clubs) {
    if (!club.city) continue;
    const g = cityGroups.get(club.city.toLowerCase()) ?? { names: new Map(), count: 0 };
    g.count++;
    g.names.set(club.city, (g.names.get(club.city) ?? 0) + 1);
    cityGroups.set(club.city.toLowerCase(), g);
  }
  const cities: [string, number][] = [...cityGroups.values()]
    .map((g) => [[...g.names.entries()].sort((a, b) => b[1] - a[1])[0][0], g.count] as [string, number])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const verifiedCount = clubs.filter((c) => c.verified).length;
  const dropInCount = clubs.filter((c) => c.drop_in).length;
  const openMatCount = clubs.filter((c) => c.open_mat).length;
  const lastUpdate = clubs.reduce<string | null>((m, c) => (c.updated_at && (!m || c.updated_at > m) ? c.updated_at : m), null);

  // Featured on the page: verified gyms first, then gyms with the most info
  const richness = (c: Club) =>
    (c.verified ? 100 : 0) + (c.drop_in ? 10 : 0) + (c.open_mat ? 5 : 0) + (isIndexableClub(c) ? 1 : 0);
  const featured = [...clubs].sort((a, b) => richness(b) - richness(a)).slice(0, FEATURED_LIMIT);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Countries", item: `${SITE_URL}/countries` },
      { "@type": "ListItem", position: 3, name: country },
    ],
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `BJJ gyms in ${country}`,
    description: `Brazilian Jiu-Jitsu gyms in ${country}, by city`,
    numberOfItems: cities.length,
    itemListElement: cities.slice(0, 50).map(([city, count], i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@type": "Place", name: `${city} — ${count} BJJ gyms`, url: `${SITE_URL}/city/${cityToSlug(city)}` },
    })),
  };

  const topCities = cities.slice(0, 3).map(([c, n]) => `${c} (${n})`).join(", ");

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <header className="flex items-center gap-4 px-5 py-4 bg-bg2 border-b border-bg3">
        <Link href="/" className="text-text2 text-xl cursor-pointer hover:bg-bg3 px-2 py-1 rounded transition-colors">
          &larr;
        </Link>
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          Roll<span className="text-accent">Map</span>
        </Link>
      </header>

      <div className="px-5 py-8 md:px-8 bg-bg2 border-b border-bg3">
        <nav className="text-xs text-text3 mb-2" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/countries" className="hover:text-accent transition-colors">Countries</Link>
          <span className="mx-1.5">/</span>
          <span className="text-text2">{country}</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
          BJJ gyms in <span className="text-accent">{country}</span>
        </h1>
        {/* Factual summary (citable answer) */}
        <p className="text-text2 text-sm max-w-3xl leading-relaxed">
          RollMap lists <strong className="text-text">{clubs.length.toLocaleString("en-US")} Brazilian Jiu-Jitsu gyms</strong> in{" "}
          {country}, across {cities.length.toLocaleString("en-US")} {cities.length > 1 ? "cities" : "city"}
          {topCities ? <>. Cities with the most gyms: {topCities}</> : null}.
          {dropInCount > 0 && <> {dropInCount} {dropInCount > 1 ? "gyms are" : "gym is"} listed as drop-in friendly</>}
          {openMatCount > 0 && <>{dropInCount > 0 ? " and" : ""} {openMatCount} run{openMatCount > 1 ? "" : "s"} open mats</>}
          {dropInCount > 0 || openMatCount > 0 ? "." : ""}
          {verifiedCount > 0 && (
            <span className="text-accent font-semibold"> ✓ {verifiedCount} verified by the gym.</span>
          )}
        </p>
        {lastUpdate && (
          <p className="text-text3 text-xs mt-2">
            Last updated {new Date(lastUpdate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
      </div>

      {/* Every city — crawlable internal links */}
      <section className="px-5 py-6 md:px-8 bg-bg border-b border-bg3">
        <h2 className="text-sm font-bold text-text2 uppercase tracking-widest mb-3">
          All cities in {country} ({cities.length})
        </h2>
        <ul className="flex gap-2 flex-wrap">
          {cities.map(([city, count]) => (
            <li key={city}>
              <Link
                href={`/city/${cityToSlug(city)}`}
                className="inline-block px-3 py-1.5 bg-bg2 border border-bg3 rounded-full text-xs font-semibold text-text2 hover:text-accent hover:border-accent transition-colors"
              >
                {city} ({count})
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <main className="flex-1">
        <CountryContent clubs={featured} country={country} total={clubs.length} />
      </main>
    </div>
  );
}
