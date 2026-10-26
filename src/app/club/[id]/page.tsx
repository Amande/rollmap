import { supabase } from "@/lib/supabase";
import { Club } from "@/lib/types";
import ClubDetail from "@/components/ClubDetail";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { clubTitle, countryToSlug, cityToSlug, isIndexableClub, prettyName, SITE_URL } from "@/lib/seo";

// Rebuilt at most every 6 hours (ISR); IndexNow pings on updates
export const revalidate = 21600;

// Pages are generated on first visit, then cached and refreshed (ISR)
export function generateStaticParams() {
  return [];
}

interface ClubPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ClubPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from("clubs")
    .select("name, city, country, website, instagram, phone, email, schedule_notes, drop_in_price")
    .eq("id", Number(id))
    .single();

  if (!data) {
    return { title: "Club not found — RollMap" };
  }

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
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !data) {
    notFound();
  }

  const club = data as Club;

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
      </main>
    </div>
  );
}
