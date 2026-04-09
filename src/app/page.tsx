import SearchBar from "@/components/SearchBar";
import NearMeButton from "@/components/NearMeButton";
import LandingMap from "./LandingMap";

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

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
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

        {/* Popular tags */}
        <div className="flex gap-2.5 flex-wrap justify-center mt-8">
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
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-text3 text-xs border-t border-bg3">
        RollMap MVP -- Data from CFJJB, 10th Planet, BJJ Globetrotters &amp;
        more.
      </footer>
    </div>
  );
}
