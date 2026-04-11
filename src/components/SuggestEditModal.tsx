"use client";

import { useState } from "react";
import { Club } from "@/lib/types";

interface SuggestEditModalProps {
  club: Club;
  open: boolean;
  onClose: () => void;
  onUpdated?: (updates: Partial<Club>) => void;
}

export default function SuggestEditModal({
  club,
  open,
  onClose,
  onUpdated,
}: SuggestEditModalProps) {
  const [form, setForm] = useState({
    kids_friendly: null as boolean | null,
    adults_only: null as boolean | null,
    gi: null as boolean | null,
    nogi: null as boolean | null,
    open_mat: null as boolean | null,
    drop_in: null as boolean | null,
    drop_in_price: "",
    schedule_notes: "",
    website: "",
    instagram: "",
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleToggle = (field: "kids_friendly" | "adults_only" | "gi" | "nogi" | "open_mat" | "drop_in") => {
    setForm((f) => ({
      ...f,
      [field]: f[field] === true ? null : true,
    }));
  };

  const handleSubmit = async () => {
    // Check that at least one field is filled
    const hasData =
      form.kids_friendly !== null ||
      form.adults_only !== null ||
      form.gi !== null ||
      form.nogi !== null ||
      form.open_mat !== null ||
      form.drop_in !== null ||
      form.drop_in_price.trim() ||
      form.schedule_notes.trim() ||
      form.website.trim() ||
      form.instagram.trim() ||
      form.comment.trim();

    if (!hasData) {
      setError("Fill in at least one field");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Build suggestion payload
    const payload: Record<string, unknown> = { club_id: club.id };
    if (form.kids_friendly !== null) payload.kids_friendly = form.kids_friendly;
    if (form.gi !== null) payload.gi = form.gi;
    if (form.nogi !== null) payload.nogi = form.nogi;
    if (form.open_mat !== null) payload.open_mat = form.open_mat;
    if (form.drop_in !== null) payload.drop_in = form.drop_in;
    if (form.drop_in_price.trim()) payload.drop_in_price = form.drop_in_price.trim();
    if (form.schedule_notes.trim()) payload.schedule_notes = form.schedule_notes.trim();
    if (form.website.trim()) payload.website = form.website.trim();
    if (form.instagram.trim()) payload.instagram = form.instagram.trim();
    if (form.comment.trim()) payload.comment = form.comment.trim();

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit");
      }
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to submit. Try again.");
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
    if (onUpdated) {
      const updates: Partial<Club> = {};
      if (form.kids_friendly !== null) updates.kids_friendly = form.kids_friendly;
      if (form.gi !== null) updates.gi = form.gi;
      if (form.nogi !== null) updates.nogi = form.nogi;
      if (form.open_mat !== null) updates.open_mat = form.open_mat;
      if (form.drop_in !== null) updates.drop_in = form.drop_in;
      if (form.drop_in_price.trim()) updates.drop_in_price = form.drop_in_price.trim();
      if (form.schedule_notes.trim()) updates.schedule_notes = form.schedule_notes.trim();
      if (form.website.trim()) updates.website = form.website.trim();
      if (form.instagram.trim()) updates.instagram = form.instagram.trim();
      onUpdated(updates);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
        <div className="bg-bg2 rounded-2xl border border-bg3 p-8 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
          <div className="text-3xl mb-3">&#10003;</div>
          <h3 className="text-lg font-bold text-text mb-2">Thanks!</h3>
          <p className="text-text3 text-sm mb-6">
            Your info for <span className="text-text font-semibold">{club.name}</span> has been added. The community thanks you!
          </p>
          <button
            onClick={onClose}
            className="bg-accent text-bg px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-accent2 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        className="bg-bg2 rounded-2xl border border-bg3 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-text">Suggest an edit</h3>
          <button onClick={onClose} className="text-text3 hover:text-text text-xl cursor-pointer">
            &times;
          </button>
        </div>

        <p className="text-text3 text-xs mb-5">
          Help the community by sharing what you know about <span className="text-text font-semibold">{club.name}</span>. Only fill what you know.
        </p>

        {/* Toggle buttons */}
        <div className="mb-5">
          <label className="text-xs uppercase text-text3 tracking-widest font-bold block mb-2">
            Who can train here?
          </label>
          <div className="flex gap-2 flex-wrap">
            <ToggleChip
              label="Kids classes"
              active={form.kids_friendly === true}
              onClick={() => handleToggle("kids_friendly")}
            />
            <ToggleChip
              label="Adults only"
              active={form.adults_only === true}
              onClick={() => handleToggle("adults_only")}
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs uppercase text-text3 tracking-widest font-bold block mb-2">
            Training style
          </label>
          <div className="flex gap-2 flex-wrap">
            <ToggleChip label="Gi" active={form.gi === true} onClick={() => handleToggle("gi")} />
            <ToggleChip label="No-Gi" active={form.nogi === true} onClick={() => handleToggle("nogi")} />
            <ToggleChip label="Open Mat" active={form.open_mat === true} onClick={() => handleToggle("open_mat")} />
            <ToggleChip label="Drop-in friendly" active={form.drop_in === true} onClick={() => handleToggle("drop_in")} />
          </div>
        </div>

        {/* Text fields */}
        <div className="space-y-4 mb-5">
          <Field
            label="Drop-in price"
            placeholder="e.g. 20€, Free first class"
            value={form.drop_in_price}
            onChange={(v) => setForm((f) => ({ ...f, drop_in_price: v }))}
          />
          <Field
            label="Schedule / hours"
            placeholder="e.g. Mon-Fri 18h-21h, Sat 10h open mat"
            value={form.schedule_notes}
            onChange={(v) => setForm((f) => ({ ...f, schedule_notes: v }))}
            multiline
          />
          <Field
            label="Website"
            placeholder="https://..."
            value={form.website}
            onChange={(v) => setForm((f) => ({ ...f, website: v }))}
          />
          <Field
            label="Instagram"
            placeholder="@clubname"
            value={form.instagram}
            onChange={(v) => setForm((f) => ({ ...f, instagram: v }))}
          />
          <Field
            label="Anything else?"
            placeholder="Tips for visitors, parking info, vibe..."
            value={form.comment}
            onChange={(v) => setForm((f) => ({ ...f, comment: v }))}
            multiline
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs mb-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-accent text-bg font-bold text-sm cursor-pointer transition-colors hover:bg-accent2 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit suggestion"}
        </button>
      </div>
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
        active
          ? "bg-accent/15 text-accent border-accent"
          : "bg-bg3 text-text3 border-transparent hover:border-bg4"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const cls =
    "w-full bg-bg3 border border-bg4 rounded-lg px-3 py-2 text-sm text-text placeholder:text-text3 outline-none focus:border-accent transition-colors";

  return (
    <div>
      <label className="text-xs text-text2 font-semibold block mb-1">{label}</label>
      {multiline ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
    </div>
  );
}
