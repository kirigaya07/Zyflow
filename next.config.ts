import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "ucarecdn.com",
      },
      {
        protocol: "https",
        hostname: "ucarecdn.net",
      },
      {
        protocol: "https",
        hostname: "ucarecd.net",
      },
    ],
  },
  experimental: {
    // Increase Server Actions body size limit to 5MB
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
