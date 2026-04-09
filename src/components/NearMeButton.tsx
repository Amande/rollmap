"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface NearMeButtonProps {
  className?: string;
}

export default function NearMeButton({ className = "" }: NearMeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push(`/search?lat=${latitude.toFixed(6)}&lng=${longitude.toFixed(6)}`);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setError("Location access denied");
        } else {
          setError("Could not get location");
        }
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 bg-bg3 text-text2 px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all border border-transparent hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-wait"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-text3 border-t-accent rounded-full animate-spin" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        )}
        {loading ? "Locating..." : "Clubs near me"}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-1.5 text-center">{error}</p>
      )}
    </div>
  );
}
