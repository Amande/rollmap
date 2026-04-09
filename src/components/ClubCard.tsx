import { Club } from "@/lib/types";
import Link from "next/link";

interface ClubCardProps {
  club: Club;
  onHover?: (club: Club | null) => void;
  distance?: string | null;
}

export default function ClubCard({ club, onHover, distance }: ClubCardProps) {
  return (
    <Link
      href={`/club/${club.id}`}
      className="block bg-bg2 border border-bg3 rounded-[10px] p-3.5 px-4 cursor-pointer transition-all hover:border-accent hover:-translate-y-0.5"
      onMouseEnter={() => onHover?.(club)}
      onMouseLeave={() => onHover?.(null)}
    >
      <h3 className="text-base font-bold mb-1 text-text">{club.name}</h3>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {club.city && (
          <span className="text-text3 text-xs">{club.city}</span>
        )}
        {club.country && club.country !== "France" && (
          <span className="text-text3 text-xs">
            {club.city ? `\u2022 ${club.country}` : club.country}
          </span>
        )}
        {distance && (
          <span className="text-accent text-xs font-semibold">
            {distance}
          </span>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {club.gi && (
          <span className="inline-block px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase tracking-wide bg-badge-gi-bg text-badge-gi">
            Gi
          </span>
        )}
        {club.nogi && (
          <span className="inline-block px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase tracking-wide bg-badge-nogi-bg text-badge-nogi">
            No-Gi
          </span>
        )}
        {club.open_mat && (
          <span className="inline-block px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase tracking-wide bg-badge-openmat-bg text-badge-openmat">
            Open Mat
          </span>
        )}
        {club.drop_in && (
          <span className="inline-block px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase tracking-wide bg-accent-bg text-accent">
            Drop-in
          </span>
        )}
        {club.kids_friendly && (
          <span className="inline-block px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase tracking-wide bg-yellow-500/15 text-yellow-400">
            Kids
          </span>
        )}
      </div>
      {club.price && (
        <p className="text-accent font-bold text-sm mt-1">{club.price}</p>
      )}
    </Link>
  );
}
