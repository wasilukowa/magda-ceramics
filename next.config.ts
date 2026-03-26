import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.instawp.site",
      },
    ],
  },
};

export default nextConfig;
