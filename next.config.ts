import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "magdaceramics.com",
      },
    ],
  },
};

export default nextConfig;
