import { Suspense } from "react";
import type { Metadata } from "next";
import SearchContent from "./SearchContent";

export const metadata: Metadata = {
  title: "Search BJJ gyms",
  description:
    "Search 10,000+ Brazilian Jiu-Jitsu gyms by city, country or club name. Filter by Gi, No-Gi, Open Mat, Drop-in friendly.",
  openGraph: {
    title: "Search BJJ gyms | RollMap",
    description: "Search 10,000+ BJJ gyms worldwide. Filter by Gi, No-Gi, Open Mat, Drop-in.",
    type: "website",
  },
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <span className="text-text3">Loading...</span>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
