import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["mermaid"],
  // Prevent heavy server-side SDKs from being bundled into every function.
  // They are still deployed as node_modules and required at runtime.
  serverExternalPackages: [
    "groq-sdk",
    "@google/generative-ai",
    "@huggingface/inference",
    "nodemailer",
  ],
  // Exclude browser-only packages from server function traces to stay under
  // Vercel's 50 MB per-function limit.
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/mermaid/**",
      "./node_modules/@mermaid-js/**",
      "./node_modules/gsap/**",
      "./node_modules/@gsap/**",
      "./node_modules/@xyflow/**",
      "./node_modules/recharts/**",
      "./node_modules/react-zoom-pan-pinch/**",
    ],
  },
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
