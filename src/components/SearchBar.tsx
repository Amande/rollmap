"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Suggestion {
  city: string;
  country: string;
  count: number;
}

interface SearchBarProps {
  defaultValue?: string;
  size?: "lg" | "md";
  className?: string;
}

export default function SearchBar({
  defaultValue = "",
  size = "lg",
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  // Sync input value when URL changes (e.g. navigating from search results)
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions on input change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const q = query.trim().toLowerCase();

      // Query distinct city + country combos matching the query
      const { data, error } = await supabase
        .from("clubs")
        .select("city, country")
        .or(`city.ilike.%${q}%,country.ilike.%${q}%,name.ilike.%${q}%`)
        .limit(500);

      if (error || !data) {
        setSuggestions([]);
        return;
      }

      // Aggregate by city + country
      const map = new Map<string, Suggestion>();
      for (const row of data) {
        const city = row.city || "Unknown";
        const country = row.country || "";
        const key = `${city}|||${country}`;
        const existing = map.get(key);
        if (existing) {
          existing.count++;
        } else {
          map.set(key, { city, country, count: 1 });
        }
      }

      // Sort: exact city match first, then "starts with", then by count
      const results = Array.from(map.values())
        .sort((a, b) => {
          const aExact = a.city.toLowerCase() === q ? 0 : 1;
          const bExact = b.city.toLowerCase() === q ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;

          const aStarts = a.city.toLowerCase().startsWith(q) ? 0 : 1;
          const bStarts = b.city.toLowerCase().startsWith(q) ? 0 : 1;
          if (aStarts !== bStarts) return aStarts - bStarts;

          return b.count - a.count || a.city.localeCompare(b.city);
        })
        .slice(0, 8);

      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    }, 250);
  }, [query]);

  const handleSelect = (suggestion: Suggestion) => {
    setShowSuggestions(false);
    setQuery(`${suggestion.city}`);
    router.push(
      `/search?q=${encodeURIComponent(suggestion.city)}&country=${encodeURIComponent(suggestion.country)}`
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelect(suggestions[selectedIndex]);
      return;
    }
    if (query.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const paddingClass = size === "lg" ? "py-4 px-5 pl-12" : "py-3 px-4 pl-10";
  const buttonClass =
    size === "lg" ? "px-6 py-2.5 text-sm" : "px-4 py-2 text-xs";

  return (
    <div ref={wrapperRef} className={`relative w-full z-[1000] ${className}`}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 text-lg">
          &#128269;
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search a city, country, or club name..."
          autoComplete="off"
          className={`w-full ${paddingClass} rounded-full border-2 border-bg4 bg-bg2 text-text text-base outline-none transition-colors focus:border-accent placeholder:text-text3`}
        />
        <button
          type="submit"
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 bg-accent text-bg rounded-full ${buttonClass} font-bold cursor-pointer transition-colors hover:bg-accent2`}
        >
          Search
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg2 border border-bg4 rounded-xl overflow-hidden shadow-xl z-50">
          {suggestions.map((s, i) => (
            <button
              key={`${s.city}-${s.country}`}
              onClick={() => handleSelect(s)}
              className={`w-full text-left px-5 py-3 flex items-center justify-between transition-colors ${
                i === selectedIndex
                  ? "bg-accent/15 text-accent"
                  : "hover:bg-bg3 text-text"
              }`}
            >
              <div>
                <span className="font-semibold">{s.city}</span>
                {s.country && (
                  <span className="text-text3 ml-2">— {s.country}</span>
                )}
              </div>
              <span className="text-xs text-text3 bg-bg4 px-2 py-0.5 rounded-full">
                {s.count} club{s.count > 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
