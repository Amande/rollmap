import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// No SEO value: API routes and internal search result URLs (/search?q=...)
const DISALLOW = ["/api/", "/search?"];

// Search engines and AI search/assistant bots (they cite and link back): allowed.
// AI training crawlers (no traffic in return): blocked (Amandine's choice, 2026-11-20,
// replaces the "allow all" choice of 2026-10-26).
const ALLOWED_BOTS = [
  // Search engines
  "Googlebot", "Bingbot", "Applebot", "DuckDuckBot",
  // AI search / citation (answer engines)
  "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User",
];

const BLOCKED_TRAINING_BOTS = [
  "GPTBot", "ClaudeBot", "CCBot", "Bytespider", "Google-Extended", "Applebot-Extended", "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...ALLOWED_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
      { userAgent: BLOCKED_TRAINING_BOTS, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
