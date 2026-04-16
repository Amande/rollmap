"use client";

import { useState } from "react";
import { Club } from "@/lib/types";
import MapDynamic from "./MapDynamic";
import SuggestEditModal from "./SuggestEditModal";

interface ClubDetailProps {
  club: Club;
}

function isValidWebUrl(str: string): boolean {
  try {
    const url = new URL(str.startsWith("http") ? str : `https://${str}`);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

function safeWebUrl(str: string): string | null {
  if (!isValidWebUrl(str)) return null;
  return str.startsWith("http") ? str : `https://${str}`;
}

function safeInstagramUrl(handle: string): string | null {
  if (handle.startsWith("http")) return isValidWebUrl(handle) ? handle : null;
  const clean = handle.replace("@", "").trim();
  if (/^[a-zA-Z0-9._]{1,30}$/.test(clean)) {
    return `https://instagram.com/${clean}`;
  }
  return null;
}

function GoogleMapsUrl(club: Club): string {
  if (club.lat && club.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${club.lat},${club.lng}`;
  }
  const q = [club.name, club.address, club.city, club.country]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export default function ClubDetail({ club: initialClub }: ClubDetailProps) {
  const [club, setClub] = useState<Club>(initialClub);
  const [showSuggest, setShowSuggest] = useState(false);
  const [trained, setTrained] = useState(false);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const url = `https://rollmap.co/club/${club.id}`;
    const text = `${club.name} — BJJ in ${club.city || club.country}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // Fallback: prompt user to copy manually
      try {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        window.prompt("Copy this link:", url);
      }
    }
  };
  const hasContact = club.phone || club.email || club.website || club.instagram;
  const hasLocation = club.lat && club.lng;
  const googleMapsUrl = GoogleMapsUrl(club);

  const handleClubUpdated = (updates: Partial<Club>) => {
    setClub((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Map hero */}
      {hasLocation && (
        <div className="h-[250px] md:h-[300px] w-full relative">
          <MapDynamic
            clubs={[club]}
            center={[club.lat!, club.lng!]}
            zoom={15}
          />
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 z-[500] flex items-center gap-1.5 bg-bg px-3 py-2 rounded-lg text-xs font-semibold text-accent border border-bg3 hover:bg-bg2 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Google Maps
          </a>
        </div>
      )}

      {/* Content */}
      <div className="px-5 py-6 md:px-8">
        <div className="flex flex-col md:flex-row md:gap-12">
          {/* Left column — main info */}
          <div className="flex-1">
            {/* Club name + badges */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-extrabold mb-3 leading-tight">
                {club.name}
              </h1>
              <div className="flex gap-1.5 flex-wrap">
                {club.gi && (
                  <span className="inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide bg-badge-gi-bg text-badge-gi">
                    Gi
                  </span>
                )}
                {club.nogi && (
                  <span className="inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide bg-badge-nogi-bg text-badge-nogi">
                    No-Gi
                  </span>
                )}
                {club.open_mat && (
                  <span className="inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide bg-badge-openmat-bg text-badge-openmat">
                    Open Mat
                  </span>
                )}
                {club.drop_in && (
                  <span className="inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide bg-accent-bg text-accent">
                    Drop-in friendly
                  </span>
                )}
                {club.kids_friendly && (
                  <span className="inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide bg-yellow-500/15 text-yellow-400">
                    Kids classes
                  </span>
                )}
              </div>
              {club.verified && (
                <div className="mt-2 flex items-center gap-1.5 text-accent text-sm font-semibold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Verified club
                </div>
              )}
            </div>

            {/* Location */}
            <section className="mb-6">
              <h2 className="text-xs uppercase text-text3 tracking-widest font-bold mb-2">
                Location
              </h2>
              {club.address && (
                <p className="text-text text-sm mb-0.5">{club.address}</p>
              )}
              <p className="text-text2 text-sm">
                {club.city}
                {club.country ? `, ${club.country}` : ""}
              </p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-accent text-sm font-semibold hover:underline"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Open in Google Maps
              </a>
            </section>

            {/* Additional info */}
            {(club.price || club.drop_in_price || club.nb_licencies) && (
              <section className="mb-6">
                <h2 className="text-xs uppercase text-text3 tracking-widest font-bold mb-2">
                  Info
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {(club.drop_in_price || club.price) && (
                    <div className="bg-bg2 rounded-lg p-3 border border-bg3">
                      <p className="text-text3 text-xs mb-1">Drop-in price</p>
                      <p className="text-text font-bold text-sm">{club.drop_in_price || club.price}</p>
                    </div>
                  )}
                  {club.nb_licencies && (
                    <div className="bg-bg2 rounded-lg p-3 border border-bg3">
                      <p className="text-text3 text-xs mb-1">Members</p>
                      <p className="text-text font-bold text-sm">{club.nb_licencies}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Schedule */}
            {club.schedule_notes && (
              <section className="mb-6">
                <h2 className="text-xs uppercase text-text3 tracking-widest font-bold mb-2">
                  Schedule
                </h2>
                <div className="bg-bg2 rounded-lg p-4 border border-bg3">
                  <p className="text-text text-sm whitespace-pre-line">{club.schedule_notes}</p>
                </div>
              </section>
            )}

            {/* Source */}
            {club.source && (
              <section className="mb-6">
                <p className="text-text3 text-xs">
                  Data from {club.source}
                  {club.source_url && (
                    <>
                      {" "}&mdash;{" "}
                      <a
                        href={club.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        source
                      </a>
                    </>
                  )}
                </p>
              </section>
            )}
          </div>

          {/* Right column — contact + actions */}
          <div className="md:w-[280px] shrink-0">
            {/* Contact card */}
            {hasContact && (
              <div className="bg-bg2 rounded-xl border border-bg3 p-5 mb-5">
                <h2 className="text-xs uppercase text-text3 tracking-widest font-bold mb-4">
                  Contact
                </h2>
                <div className="space-y-3">
                  {club.website && safeWebUrl(club.website) && (
                    <a
                      href={safeWebUrl(club.website)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-text hover:text-accent transition-colors group"
                    >
                      <span className="w-8 h-8 rounded-lg bg-bg3 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      </span>
                      <span className="truncate">Website</span>
                    </a>
                  )}
                  {club.instagram && safeInstagramUrl(club.instagram) && (
                    <a
                      href={safeInstagramUrl(club.instagram)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-text hover:text-accent transition-colors group"
                    >
                      <span className="w-8 h-8 rounded-lg bg-bg3 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                      </span>
                      <span className="truncate">Instagram</span>
                    </a>
                  )}
                  {club.phone && (
                    <a
                      href={`tel:${club.phone}`}
                      className="flex items-center gap-3 text-sm text-text hover:text-accent transition-colors group"
                    >
                      <span className="w-8 h-8 rounded-lg bg-bg3 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </span>
                      <span className="truncate">{club.phone}</span>
                    </a>
                  )}
                  {club.email && (
                    <a
                      href={`mailto:${club.email}`}
                      className="flex items-center gap-3 text-sm text-text hover:text-accent transition-colors group"
                    >
                      <span className="w-8 h-8 rounded-lg bg-bg3 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </span>
                      <span className="truncate">{club.email}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setShowSuggest(true)}
                className="w-full py-3 rounded-xl bg-accent text-bg font-bold text-sm cursor-pointer transition-colors hover:bg-accent2"
              >
                Suggest an edit
              </button>
              <button
                onClick={handleShare}
                className="w-full py-3 rounded-xl bg-bg2 text-text2 font-bold text-sm cursor-pointer transition-colors hover:bg-bg3 border border-bg3 flex items-center justify-center gap-2"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                {shared ? "Link copied!" : "Share this gym"}
              </button>
              <button
                onClick={async () => {
                  if (trained || trainingLoading) return;
                  setTrainingLoading(true);
                  try {
                    const res = await fetch("/api/suggest", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ club_id: club.id, type: "trained" }),
                    });
                    if (res.ok) setTrained(true);
                  } catch {}
                  setTrainingLoading(false);
                }}
                disabled={trainingLoading}
                className={`w-full py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors border ${
                  trained
                    ? "bg-accent/15 text-accent border-accent"
                    : "bg-bg2 text-text2 border-bg3 hover:bg-bg3"
                } disabled:opacity-50`}
              >
                {trainingLoading ? "Saving..." : trained ? "You've trained here!" : "I've trained here"}
              </button>
            </div>

            <SuggestEditModal
              club={club}
              open={showSuggest}
              onClose={() => setShowSuggest(false)}
              onUpdated={handleClubUpdated}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
