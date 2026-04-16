import { supabase } from "@/lib/supabase";
import { Club } from "@/lib/types";
import ClubDetail from "@/components/ClubDetail";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface ClubPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ClubPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from("clubs")
    .select("name, city, country")
    .eq("id", Number(id))
    .single();

  if (!data) {
    return { title: "Club not found — RollMap" };
  }

  const title = `${data.name} — BJJ in ${data.city || data.country}`;
  const description = `${data.name} — Brazilian Jiu-Jitsu gym in ${data.city || ""}${data.country ? `, ${data.country}` : ""}. Find schedule, contact, and training info on RollMap.`;

  return {
    title,
    description,
    openGraph: { title: `${title} | RollMap`, description, type: "website" },
    alternates: {
      canonical: `/club/${id}`,
    },
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

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: club.name,
    sport: "Brazilian Jiu-Jitsu",
    url: `https://rollmap.co/club/${club.id}`,
    ...(club.address && { address: {
      "@type": "PostalAddress",
      streetAddress: club.address,
      addressLocality: club.city || undefined,
      addressCountry: club.country || undefined,
    }}),
    ...(club.lat && club.lng && { geo: {
      "@type": "GeoCoordinates",
      latitude: club.lat,
      longitude: club.lng,
    }}),
    ...(club.phone && { telephone: club.phone }),
    ...(club.email && { email: club.email }),
    ...(club.website && { url: club.website.startsWith("http") ? club.website : `https://${club.website}` }),
  };

  // Breadcrumb JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://rollmap.co" },
      ...(club.country ? [{ "@type": "ListItem", position: 2, name: club.country, item: `https://rollmap.co/country/${club.country.toLowerCase().replace(/\s+/g, "-")}` }] : []),
      ...(club.city ? [{ "@type": "ListItem", position: club.country ? 3 : 2, name: club.city, item: `https://rollmap.co/city/${club.city.toLowerCase().replace(/\s+/g, "-")}` }] : []),
      { "@type": "ListItem", position: (club.country ? 3 : 2) + (club.city ? 1 : 0), name: club.name },
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
