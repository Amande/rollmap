import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TARGETS = ["website", "instagram", "phone", "email", "directions"] as const;

// Logs an outbound click from a club page (fire-and-forget from the client)
export async function POST(request: NextRequest) {
  try {
    const { club_id, target } = await request.json();
    const id = Number(club_id);

    if (!Number.isInteger(id) || id <= 0 || !TARGETS.includes(target)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Unknown club_id is rejected by the foreign key; nothing else to do
    await supabase.from("club_clicks").insert([{ club_id: id, target }]);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
