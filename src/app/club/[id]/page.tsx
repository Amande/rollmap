import { supabase } from "@/lib/supabase";
import { Club } from "@/lib/types";
import ClubDetail from "@/components/ClubDetail";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { clubTitle, countryToSlug, cityToSlug, isIndexableClub, prettyName, SITE_URL } from "@/lib/seo";

// Rebuilt at most every 6 hours (ISR); IndexNow pings on updates
export const revalidate = 21600;

// Pages are generated on first visit, then cached and refreshed (ISR)
export function generateStaticParams() {
  return [];
}

// One Supabase query per render, shared by generateMetadata and the page.
// Ids that aren't positive integers (e.g. /club/tel:0782944216 from bots or
// mangled links) are a 404 without touching Supabase. No row → null (404);
// any other error is transient: throw, so ISR keeps serving the last good
// version instead of caching a 404.
const getClub = cache(async (rawId: string): Promise<Club | null> => {
  if (!/^[1-9]\d*$/.test(rawId)) return null;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id)) return null;
  const { data, error } = await supabase.from("clubs").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return (data as Club | null) ?? null;
});

// Other gyms in the same city: internal links so crawlers (and visitors) reach
// sibling pages from every club page. Verified first, then gyms with contact info.
// Never blocks the page: on error, the section is simply not rendered.
type SiblingClub = Pick<Club, "id" | "name" | "verified" | "drop_in_price" | "website" | "instagram" | "phone" | "email" | "schedule_notes">;

async function getSiblingClubs(club: Club): Promise<SiblingClub[]> {
  if (!club.city) return [];
  try {
    let q = supabase
      .from("clubs")
      .select("id, name, verified, drop_in_price, website, instagram, phone, email, schedule_notes")
      .eq("city", club.city)
      .neq("id", club.id)
      .order("verified", { ascending: false })
      .limit(40);
    if (club.country) q = q.eq("country", club.country);
    const { data, error } = await q;
    if (error || !data) return [];
    return (data as SiblingClub[]).filter(isIndexableClub).slice(0, 6);
  } catch {
    return [];
  }
}

interface ClubPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ClubPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getClub(id);

  if (!data) return {};

  const name = prettyName(data.name);
  const place = [data.city, data.country].filter(Boolean).join(", ");
  const title = clubTitle(data.name, data.city || data.country);
  const drop = data.drop_in_price ? ` Drop-in: ${data.drop_in_price}.` : "";
  let description = `${name}: Brazilian Jiu-Jitsu gym${place ? ` in ${place}` : ""}.${drop} Open mat, contact and map on RollMap.`;
  if (description.length > 155) description = `${description.slice(0, 152).replace(/\s+\S*$/, "")}…`;

  const rich = isIndexableClub(data);

  return {
    title,
    description,
    openGraph: { title: `${title} | RollMap`, description, type: "website" },
    alternates: {
      canonical: `/club/${id}`,
    },
    robots: rich
      ? { index: true, follow: true }
      : { index: false, follow: true }, // noindex thin clubs but keep crawling internal links
  };
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { id } = await params;
  const club = await getClub(id);
  if (!club) {
    notFound();
  }
  const siblings = await getSiblingClubs(club);

  // JSON-LD structured data (only facts visible on the page)
  const website = club.website ? (club.website.startsWith("http") ? club.website : `https://${club.website}`) : null;
  const instagram = club.instagram
    ? club.instagram.startsWith("http")
      ? club.instagram
      : `https://instagram.com/${club.instagram.replace("@", "").trim()}`
    : null;
  const sameAs = [website, instagram].filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: prettyName(club.name),
    sport: "Brazilian Jiu-Jitsu",
    url: `${SITE_URL}/club/${club.id}`,
    ...(club.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: club.address,
        addressLocality: club.city || undefined,
        addressCountry: club.country || undefined,
      },
    }),
    ...(club.lat && club.lng && { geo: { "@type": "GeoCoordinates", latitude: club.lat, longitude: club.lng } }),
    ...(club.phone && { telephone: club.phone }),
    ...(club.email && { email: club.email }),
    ...(sameAs.length > 0 && { sameAs }),
    ...((club.drop_in_price || club.price) && { priceRange: club.drop_in_price || club.price }),
  };

  // Breadcrumb JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://rollmap.co" },
      ...(club.country ? [{ "@type": "ListItem", position: 2, name: club.country, item: `${SITE_URL}/country/${countryToSlug(club.country)}` }] : []),
      ...(club.city ? [{ "@type": "ListItem", position: club.country ? 3 : 2, name: club.city, item: `${SITE_URL}/city/${cityToSlug(club.city)}` }] : []),
      { "@type": "ListItem", position: (club.country ? 3 : 2) + (club.city ? 1 : 0), name: prettyName(club.name) },
    ],
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
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight"
        >
          Roll<span className="text-accent">Map</span>
        </Link>
      </header>

      {/* Breadcrumb */}
      <nav className="px-5 pt-4 text-xs text-text3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        {club.country && (
          <>
            <span className="mx-1.5">/</span>
            <Link href={`/country/${club.country.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-accent transition-colors">{club.country}</Link>
          </>
        )}
        {club.city && (
          <>
            <span className="mx-1.5">/</span>
            <Link href={`/city/${club.city.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-accent transition-colors">{club.city}</Link>
          </>
        )}
        <span className="mx-1.5">/</span>
        <span className="text-text2">{club.name}</span>
      </nav>

      {/* Content */}
      <main className="flex-1">
        <ClubDetail club={club} />
        {siblings.length > 0 && club.city && (
          <section className="px-5 pb-8 max-w-[700px]">
            <h2 className="text-xs font-bold text-text3 uppercase tracking-widest mb-3">
              More BJJ gyms in {club.city}
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              {siblings.map((s) => (
                <li key={s.id}>
                  <Link href={`/club/${s.id}`} className="text-accent hover:underline">
                    {prettyName(s.name)}
                  </Link>
                  {s.verified && <span className="text-text3"> · verified</span>}
                  {s.drop_in_price && <span className="text-text3"> · drop-in {s.drop_in_price}</span>}
                </li>
              ))}
            </ul>
            <Link href={`/city/${cityToSlug(club.city)}`} className="inline-block mt-3 text-xs text-accent hover:underline">
              All gyms in {club.city} &rarr;
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
