import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["mermaid"],
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
