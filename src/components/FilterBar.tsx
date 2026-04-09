"use client";

import { ClubFilters } from "@/lib/types";

interface FilterBarProps {
  filters: ClubFilters;
  onChange: (filters: ClubFilters) => void;
}

const FILTER_OPTIONS: { key: keyof ClubFilters; label: string }[] = [
  { key: "gi", label: "Gi" },
  { key: "nogi", label: "No-Gi" },
  { key: "open_mat", label: "Open Mat" },
  { key: "drop_in", label: "Drop-in" },
  { key: "kids_friendly", label: "Kids" },
];

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const toggle = (key: keyof ClubFilters) => {
    onChange({ ...filters, [key]: filters[key] ? undefined : true });
  };

  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-bg2 border-b border-bg3">
      {FILTER_OPTIONS.map(({ key, label }) => {
        const active = !!filters[key];
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
              active
                ? "bg-accent-bg text-accent border-accent"
                : "bg-bg3 text-text2 border-transparent hover:bg-accent-bg hover:text-accent hover:border-accent"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
