import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.openastra.com/api/:path*",
      },
    ];
  },
};
export default nextConfig;
