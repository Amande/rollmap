import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external images if needed in the future
  images: {
    remotePatterns: [],
  },
  // City pages merged into their English name (data cleanup 2026-09-30)
  async redirects() {
    return [
      { source: "/city/lisboa", destination: "/city/lisbon", permanent: true },
      { source: "/city/warszawa", destination: "/city/warsaw", permanent: true },
      // Old ?page=N pagination → path-based pages (keeps city pages ISR)
      {
        source: "/city/:slug",
        has: [{ type: "query", key: "page", value: "(?<n>[2-9]|[1-9]\\d+)" }],
        destination: "/city/:slug/page/:n",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
