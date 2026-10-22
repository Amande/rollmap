import { Club, ClubFilters } from "./types";

/** Apply the FilterBar toggles to a list of clubs. */
export function applyFilters<T extends Club>(clubs: T[], filters: ClubFilters): T[] {
  let result = clubs;
  if (filters.verified) result = result.filter((c) => c.verified);
  if (filters.gi) result = result.filter((c) => c.gi);
  if (filters.nogi) result = result.filter((c) => c.nogi);
  if (filters.open_mat) result = result.filter((c) => c.open_mat);
  if (filters.drop_in) result = result.filter((c) => c.drop_in);
  if (filters.kids_friendly) result = result.filter((c) => c.kids_friendly);
  return result;
}

/** Gyms that confirmed their info come first; original order kept otherwise (stable sort). */
export function verifiedFirst<T extends Club>(clubs: T[]): T[] {
  return [...clubs].sort((a, b) => Number(!!b.verified) - Number(!!a.verified));
}
