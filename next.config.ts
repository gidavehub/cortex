import type { NextConfig } from "next";

// @ts-ignore - eslint and typescript property might not be in the strict type depending on version
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
