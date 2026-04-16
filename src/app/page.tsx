import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";
import NearMeButton from "@/components/NearMeButton";
import LandingMap from "./LandingMap";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RollMap",
    url: "https://rollmap.co",
    description: "Find Brazilian Jiu-Jitsu gyms to train anywhere in the world.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://rollmap.co/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RollMap",
    url: "https://rollmap.co",
    sameAs: ["https://twitter.com/O_Amande"],
  },
];

const POPULAR_CITIES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Bordeaux",
  "Toulouse",
  "Lisbon",
  "Barcelona",
  "London",
  "Austin",
  "San Diego",
];

const POPULAR_COUNTRIES = [
  { name: "Brazil", clubs: "4700+" },
  { name: "United States", clubs: "2100+" },
  { name: "France", clubs: "680+" },
  { name: "Japan", clubs: "290+" },
  { name: "United Kingdom", clubs: "260+" },
  { name: "Canada", clubs: "200+" },
  { name: "Australia", clubs: "190+" },
  { name: "Portugal", clubs: "180+" },
  { name: "Spain", clubs: "180+" },
  { name: "South Korea", clubs: "130+" },
  { name: "Italy", clubs: "100+" },
  { name: "Germany", clubs: "80+" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-bg2 border-b border-bg3">
        <div className="text-xl font-extrabold tracking-tight">
          Roll<span className="text-accent">Map</span>
        </div>
        <span className="text-text3 text-xs hidden sm:inline">
          10,000+ BJJ gyms worldwide
        </span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-2">
          Find your next <span className="text-accent">roll</span>.
        </h1>
        <p className="text-text2 text-lg mb-8">
          Discover BJJ gyms to train, anywhere in the world.
        </p>

        <SearchBar size="lg" className="max-w-[520px]" />

        <div className="mt-4">
          <NearMeButton />
        </div>

        {/* Map preview */}
        <div className="w-full max-w-[700px] h-[160px] sm:h-[280px] rounded-[10px] overflow-hidden mt-9 border border-bg3 touch-none">
          <LandingMap />
        </div>

        {/* Popular countries */}
        <div className="w-full max-w-[700px] mt-8">
          <h2 className="text-xs font-bold text-text3 uppercase tracking-widest mb-3">
            Browse by country
          </h2>
          <div className="flex gap-2.5 flex-wrap justify-center">
            {POPULAR_COUNTRIES.map(({ name, clubs }) => (
              <a
                key={name}
                href={`/country/${name.toLowerCase().replace(/\s+/g, "-")}`}
                className="bg-bg3 text-text2 px-3.5 py-1.5 rounded-full text-xs cursor-pointer transition-all border border-transparent hover:border-accent hover:text-accent"
              >
                {name} <span className="text-text3">({clubs})</span>
              </a>
            ))}
          </div>
        </div>

        {/* Popular cities */}
        <div className="w-full max-w-[700px] mt-5">
          <h2 className="text-xs font-bold text-text3 uppercase tracking-widest mb-3">
            Popular cities
          </h2>
          <div className="flex gap-2.5 flex-wrap justify-center">
            {POPULAR_CITIES.map((city) => (
              <a
                key={city}
                href={`/city/${city.toLowerCase().replace(/\s+/g, "-")}`}
                className="bg-bg3 text-text2 px-3.5 py-1.5 rounded-full text-xs cursor-pointer transition-all border border-transparent hover:border-accent hover:text-accent"
              >
                {city}
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
