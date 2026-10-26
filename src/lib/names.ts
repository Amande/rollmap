const KEEP_UPPER = new Set(["BJJ", "JJB", "MMA", "GB", "ATT", "SBG", "UFC", "RNK", "USA", "UK", "NYC", "LA", "SSF", "CT", "PS", "II", "III"]);

/** "B9 PARIS" -> "B9 Paris": federation data is often all caps. Mixed-case names are kept as is. */
export function prettyName(name: string): string {
  const trimmed = name.trim();
  if (trimmed !== trimmed.toUpperCase() || !/[A-Z]/.test(trimmed)) return trimmed;
  return trimmed
    .split(/\s+/)
    .map((word) => {
      const core = word.replace(/[^A-Za-z0-9]/g, "");
      if (KEEP_UPPER.has(core) || /\d/.test(core)) return word;
      return word
        .split("-")
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join("-");
    })
    .join(" ");
}
