import Link from "next/link";
import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/contact";
import { getPlaceStats, SITE_URL } from "@/lib/seo";
import { supabase } from "@/lib/supabase";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "About RollMap: sources & methodology",
  description:
    "How RollMap lists BJJ gyms worldwide: data sources, how gyms verify their drop-in and open mat info, update frequency and corrections.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [{ cities, countries, lastmod }, verified] = await Promise.all([
    getPlaceStats(),
    supabase.from("clubs").select("id", { count: "exact", head: true }).eq("verified", true),
  ]);
  const totalClubs = [...countries.values()].reduce((s, c) => s + c.count, 0);
  const updated = lastmod
    ? new Date(lastmod).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About RollMap",
    url: `${SITE_URL}/about`,
    mainEntity: { "@type": "Organization", name: "RollMap", url: SITE_URL, email: CONTACT_EMAIL },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <header className="flex items-center gap-4 px-5 py-4 bg-bg2 border-b border-bg3">
        <Link href="/" className="text-text2 text-xl cursor-pointer hover:bg-bg3 px-2 py-1 rounded transition-colors">
          &larr;
        </Link>
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          Roll<span className="text-accent">Map</span>
        </Link>
      </header>

      <main className="flex-1 px-5 py-8 md:px-8 max-w-3xl mx-auto w-full text-text2 text-sm leading-relaxed">
        <nav className="text-xs text-text3 mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-text2">About</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4 text-text">About RollMap</h1>

        <p className="mb-6">
          RollMap is a free map of Brazilian Jiu-Jitsu gyms for people who travel and want to keep training. It currently
          lists <strong className="text-text">{totalClubs.toLocaleString("en-US")} gyms</strong> in{" "}
          {countries.size} countries and {cities.size.toLocaleString("en-US")} cities, of which{" "}
          <strong className="text-text">{verified.count ?? 0} are verified by the gym itself</strong>.
          {updated && <> Data last updated on {updated}.</>}
        </p>

        <h2 className="text-lg font-bold text-text mt-8 mb-2">Where the data comes from</h2>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>Public academy directories of BJJ federations (IBJJF registered academies, French CFJJB clubs).</li>
          <li>Public academy lists of affiliation networks and gyms&apos; own websites.</li>
          <li>Information sent directly by gyms and by grapplers through the &quot;Suggest an edit&quot; button.</li>
        </ul>

        <h2 className="text-lg font-bold text-text mt-8 mb-2">What &quot;Verified by the gym&quot; means</h2>
        <p className="mb-6">
          We contact gyms by email or Instagram and ask them to confirm three things: whether they welcome drop-in
          visitors, the visitor price, and whether they run an open mat. A gym gets the{" "}
          <span className="text-accent font-semibold">✓ Verified</span> badge only once it has answered us directly.
          Other listings come from public sources and may be outdated: always message a gym before visiting.
        </p>

        <h2 className="text-lg font-bold text-text mt-8 mb-2">Freshness</h2>
        <p className="mb-6">
          Gym pages are updated as soon as a gym or a visitor sends new information. Each city and country page shows its
          last update date.
        </p>

        <h2 className="text-lg font-bold text-text mt-8 mb-2">Corrections and removal</h2>
        <p className="mb-6">
          Gym owners can ask us to correct or remove their listing at any time at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a> or from the{" "}
          <Link href="/contact" className="text-accent hover:underline">contact page</Link>.
        </p>

        <p className="mt-10">
          Start exploring: <Link href="/countries" className="text-accent hover:underline">BJJ gyms by country</Link> ·{" "}
          <Link href="/blog" className="text-accent hover:underline">travel & tournament guides</Link>. Oss.
        </p>
      </main>
    </div>
  );
}
