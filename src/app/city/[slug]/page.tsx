import { supabase } from "@/lib/supabase";
import { Club } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CityContent from "./CityContent";
import { getEventPostsForCity } from "@/content/blog";
import { countryToSlug, MIN_CLUBS_INDEXABLE_CITY, SITE_URL } from "@/lib/seo";

// Rebuilt at most every 6 hours (ISR)
export const revalidate = 21600;

const PAGE_SIZE = 150;

interface CityPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

function slugToCity(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Slugs turn spaces into "-", but city names can also contain "-" (Saint-Ouen).
// "_" is ILIKE's single-char wildcard, so it matches either.
function slugToCityPattern(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, "_");
}

function pageNumber(raw?: string): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 1 ? n : 1;
}

async function countClubs(slug: string): Promise<number> {
  const { count } = await supabase
    .from("clubs")
    .select("id", { count: "exact", head: true })
    .ilike("city", slugToCityPattern(slug));
  return count ?? 0;
}

export async function generateMetadata({ params, searchParams }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = pageNumber((await searchParams).page);
  const count = await countClubs(slug);
  if (!count) return { title: `BJJ gyms in ${slugToCity(slug)}` };

  const { data } = await supabase.from("clubs").select("city, country").ilike("city", slugToCityPattern(slug)).limit(1);
  const city = data?.[0]?.city ?? slugToCity(slug);
  const country = data?.[0]?.country;
  const pageSuffix = page > 1 ? ` (page ${page})` : "";
  const title = `BJJ gyms in ${city} — ${count} club${count > 1 ? "s" : ""}${pageSuffix}`;
  const description = `${count} Brazilian Jiu-Jitsu gym${count > 1 ? "s" : ""} in ${city}${country ? `, ${country}` : ""}: drop-in prices, open mats, Gi & No-Gi, contacts and map.`;

  return {
    title,
    description,
    openGraph: { title: `${title} | RollMap`, description, type: "website" },
    alternates: { canonical: page > 1 ? `/city/${slug}?page=${page}` : `/city/${slug}` },
    // Single-gym cities are thin pages: reachable, but kept out of the index
    robots: count < MIN_CLUBS_INDEXABLE_CITY ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function CityPage({ params, searchParams }: CityPageProps) {
  const { slug } = await params;
  const page = pageNumber((await searchParams).page);
  const total = await countClubs(slug);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (!total || page > pages) notFound();

  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .ilike("city", slugToCityPattern(slug))
    .order("verified", { ascending: false })
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (error || !data || data.length === 0) notFound();

  const clubs = data as Club[];
  const city = clubs[0]?.city || slugToCity(slug);
  const country = clubs[0]?.country || "";

  // Summary figures for the whole city (not only this page)
  const { data: stats } = await supabase
    .from("clubs")
    .select("verified, drop_in, open_mat, updated_at")
    .ilike("city", slugToCityPattern(slug))
    .limit(1000);
  const verifiedCount = (stats ?? []).filter((c) => c.verified).length;
  const dropInCount = (stats ?? []).filter((c) => c.drop_in).length;
  const openMatCount = (stats ?? []).filter((c) => c.open_mat).length;
  const lastUpdate = (stats ?? []).reduce<string | null>((m, c) => (c.updated_at && (!m || c.updated_at > m) ? c.updated_at : m), null);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(country ? [{ "@type": "ListItem", position: 2, name: country, item: `${SITE_URL}/country/${countryToSlug(country)}` }] : []),
      { "@type": "ListItem", position: country ? 3 : 2, name: city },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `BJJ gyms in ${city}`,
    description: `Brazilian Jiu-Jitsu gyms in ${city}${country ? `, ${country}` : ""}`,
    numberOfItems: total,
    itemListElement: clubs.slice(0, 30).map((club, i) => ({
      "@type": "ListItem",
      position: (page - 1) * PAGE_SIZE + i + 1,
      item: {
        "@type": "SportsActivityLocation",
        name: club.name,
        sport: "Brazilian Jiu-Jitsu",
        url: `${SITE_URL}/club/${club.id}`,
      },
    })),
  };

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
        {country && (
          <nav className="text-xs text-text3 mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-accent transition-colors">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href={`/country/${countryToSlug(country)}`} className="hover:text-accent transition-colors">{country}</Link>
            <span className="mx-1.5">/</span>
            <span className="text-text2">{city}</span>
          </nav>
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
          BJJ gyms in <span className="text-accent">{city}</span>
        </h1>
        {/* Factual summary (citable answer) */}
        <p className="text-text2 text-sm max-w-3xl leading-relaxed">
          RollMap lists <strong className="text-text">{total} Brazilian Jiu-Jitsu {total > 1 ? "gyms" : "gym"}</strong> in {city}
          {country ? `, ${country}` : ""}.
          {dropInCount > 0 && <> {dropInCount} {dropInCount > 1 ? "are" : "is"} listed as drop-in friendly</>}
          {openMatCount > 0 && <>{dropInCount > 0 ? " and" : ""} {openMatCount} {openMatCount > 1 ? "run" : "runs"} open mats</>}
          {dropInCount > 0 || openMatCount > 0 ? "." : ""}
          {verifiedCount > 0 && (
            <span className="text-accent font-semibold"> ✓ {verifiedCount} verified by the gym</span>
          )}
          {verifiedCount > 0 ? "." : ""} Always message a gym before visiting to confirm class times.
        </p>
        {lastUpdate && (
          <p className="text-text3 text-xs mt-2">
            Last updated {new Date(lastUpdate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
      </div>

      {getEventPostsForCity(decodeURIComponent(slug)).map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="mx-5 md:mx-8 mt-4 flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 hover:bg-accent/20 transition-colors"
        >
          <span className="text-sm">
            <strong className="text-text">Visiting {city} for {post.event}?</strong>{" "}
            <span className="text-text2">Dates, deadlines and where to train.</span>
          </span>
          <span className="text-accent text-sm font-semibold shrink-0">Read the guide &rarr;</span>
        </Link>
      ))}

      <main className="flex-1">
        <CityContent clubs={clubs} city={city} />
      </main>

      {pages > 1 && (
        <nav className="flex justify-center gap-2 py-6 border-t border-bg3" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={n === 1 ? `/city/${slug}` : `/city/${slug}?page=${n}`}
              aria-current={n === page ? "page" : undefined}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                n === page ? "bg-accent text-bg border-accent" : "bg-bg2 text-text2 border-bg3 hover:border-accent"
              }`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
