import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// No SEO value: API routes and internal search result URLs (/search?q=...)
const DISALLOW = ["/api/", "/search?"];

// Search & citation crawlers + AI training crawlers: all explicitly allowed (Amandine's choice, 2026-10-26)
const ALLOWED_BOTS = [
  // Search engines
  "Googlebot", "Bingbot", "Applebot", "DuckDuckBot",
  // AI search / citation (answer engines)
  "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User",
  // AI training
  "GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...ALLOWED_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
      { userAgent: "*", allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
