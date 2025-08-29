import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    nodeMiddleware: true, // keep if you need it
  },
  eslint: {
    ignoreDuringBuilds: true, // ignore ESLint errors during deployment
  },
  typescript: {
    ignoreBuildErrors: true, // ignore TypeScript type errors during deployment
  },
};

export default nextConfig;
