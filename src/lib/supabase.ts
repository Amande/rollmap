import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side only: give up on Supabase after 8s instead of hanging until the
// Vercel function times out (billed duration spike during the Nov 2026 outage).
// A timeout surfaces as a query error, so pages throw and ISR keeps serving the
// last good version. Browser calls (map, search) keep no limit for slow mobiles.
const SERVER_TIMEOUT_MS = 8000;

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(SERVER_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: typeof window === "undefined" ? { fetch: fetchWithTimeout } : {},
});
