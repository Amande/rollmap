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
    ];
  },
};

export default nextConfig;
