import Link from "next/link";
import type { Metadata } from "next";
import { getPlaceStats, countryToSlug, SITE_URL } from "@/lib/seo";

// Rebuilt at most once a day: counts change slowly
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "BJJ gyms by country",
  description:
    "Browse Brazilian Jiu-Jitsu gyms in every country listed on RollMap, with the number of clubs and cities per country.",
  alternates: { canonical: "/countries" },
};

export default async function CountriesPage() {
  const { countries } = await getPlaceStats();
  const list = [...countries.values()].sort((a, b) => a.name.localeCompare(b.name));
  const totalClubs = list.reduce((s, c) => s + c.count, 0);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Countries" },
    ],
  };
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "BJJ gyms by country",
    numberOfItems: list.length,
    itemListElement: list.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${c.name} — ${c.count} BJJ gyms`,
      url: `${SITE_URL}/country/${countryToSlug(c.name)}`,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />

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
          <span className="text-text2">Countries</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
          BJJ gyms by <span className="text-accent">country</span>
        </h1>
        <p className="text-text2 text-sm">
          RollMap lists {totalClubs.toLocaleString("en-US")} Brazilian Jiu-Jitsu gyms in {list.length} countries.
          Pick a country to see its cities and gyms.
        </p>
      </div>

      <main className="flex-1 px-5 py-6 md:px-8">
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {list.map((c) => (
            <li key={c.name}>
              <Link
                href={`/country/${countryToSlug(c.name)}`}
                className="flex justify-between gap-3 bg-bg2 border border-bg3 rounded-lg px-4 py-3 text-sm hover:border-accent transition-colors"
              >
                <span className="font-semibold text-text">{c.name}</span>
                <span className="text-text3">
                  {c.count} gym{c.count > 1 ? "s" : ""} · {c.cities} {c.cities > 1 ? "cities" : "city"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
