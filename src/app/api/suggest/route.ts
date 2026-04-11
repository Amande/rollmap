import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_BOOLEAN_FIELDS = [
  "kids_friendly",
  "gi",
  "nogi",
  "open_mat",
  "drop_in",
] as const;

const MAX_TEXT_LENGTH = 500;
const MAX_SHORT_TEXT = 200;

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str.startsWith("http") ? str : `https://${str}`);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeText(str: string, maxLen: number): string {
  return str.trim().slice(0, maxLen);
}

function sanitizeInstagram(str: string): string {
  // Extract just the handle — strip URLs, @, whitespace
  const cleaned = str.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/^@/, "").replace(/\/.*$/, "").trim();
  // Only allow alphanumeric, dots, underscores (valid IG handle chars)
  if (/^[a-zA-Z0-9._]{1,30}$/.test(cleaned)) return cleaned;
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { club_id, type, ...fields } = body;

    if (!club_id) {
      return NextResponse.json({ error: "Missing club_id" }, { status: 400 });
    }

    // Verify club exists
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("id", club_id)
      .single();

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Handle "I've trained here" — just log, no club update
    if (type === "trained") {
      const { error } = await supabase.from("club_suggestions").insert([{
        club_id,
        comment: "I've trained here",
        status: "approved",
      }]);
      if (error) {
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    // Build validated update + log payloads
    const clubUpdate: Record<string, unknown> = {};
    const suggestion: Record<string, unknown> = {
      club_id,
      status: "approved",
    };

    // Validate boolean fields
    for (const field of ALLOWED_BOOLEAN_FIELDS) {
      if (fields[field] === true) {
        clubUpdate[field] = true;
        suggestion[field] = true;
      }
    }

    // Validate text fields
    if (fields.drop_in_price && typeof fields.drop_in_price === "string") {
      const val = sanitizeText(fields.drop_in_price, MAX_SHORT_TEXT);
      clubUpdate.drop_in_price = val;
      suggestion.drop_in_price = val;
    }
    if (fields.schedule_notes && typeof fields.schedule_notes === "string") {
      const val = sanitizeText(fields.schedule_notes, MAX_TEXT_LENGTH);
      clubUpdate.schedule_notes = val;
      suggestion.schedule_notes = val;
    }
    if (fields.website && typeof fields.website === "string") {
      const url = fields.website.trim();
      if (isValidUrl(url)) {
        const val = sanitizeText(url, MAX_SHORT_TEXT);
        clubUpdate.website = val;
        suggestion.website = val;
      }
    }
    if (fields.instagram && typeof fields.instagram === "string") {
      const handle = sanitizeInstagram(fields.instagram);
      if (handle) {
        clubUpdate.instagram = handle;
        suggestion.instagram = handle;
      }
    }
    if (fields.comment && typeof fields.comment === "string") {
      suggestion.comment = sanitizeText(fields.comment, MAX_TEXT_LENGTH);
    }

    // Check there's at least one actual data field
    const dataFields = Object.keys(suggestion).filter(
      (k) => k !== "club_id" && k !== "status"
    );
    if (dataFields.length === 0) {
      return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
    }

    // 1. Apply validated changes to the club
    if (Object.keys(clubUpdate).length > 0) {
      const { error } = await supabase
        .from("clubs")
        .update(clubUpdate)
        .eq("id", club_id);
      if (error) {
        console.error("Club update error:", error);
        return NextResponse.json({ error: "Failed to update club" }, { status: 500 });
      }
    }

    // 2. Log the suggestion for audit / rollback history
    const { error } = await supabase.from("club_suggestions").insert([suggestion]);
    if (error) {
      console.error("Suggestion log error:", error);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
