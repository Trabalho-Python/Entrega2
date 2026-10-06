import type { NextConfig } from "next";

const apiInternal = process.env.API_INTERNAL_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  basePath: "/NoPrazo",
  async rewrites() {
    return [
      {
        source: "/api/help-desk/:path*",
        destination: `${apiInternal}/:path*`,
      },
    ];
  },
};

export default nextConfig;
