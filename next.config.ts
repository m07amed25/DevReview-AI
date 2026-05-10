import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mermaid is browser-only — never bundle it on the server.
  // isomorphic-dompurify + jsdom ARE intentionally used server-side (Inngest),
  // so they must remain resolvable. Add them to serverExternalPackages so
  // they're required from node_modules at runtime (never statically bundled),
  // which avoids the ERR_REQUIRE_ESM from @exodus/bytes.
  serverExternalPackages: [
    "groq-sdk",
    "@google/generative-ai",
    "@huggingface/inference",
    "nodemailer",
  ],
  // Exclude browser-only packages and large non-Linux binaries from server
  // function traces to stay under Vercel's 250 MB per-function limit.
  outputFileTracingExcludes: {
    "*": [
      // Prisma: exclude Windows engine (Vercel runs Linux rhel-openssl-3.0.x)
      "./src/server/db/client/query_engine-windows.dll.node",
      // Prisma: exclude WASM / edge-runtime engines (serverless uses native)
      "./src/server/db/client/query_engine_bg.wasm",
      "./src/server/db/client/query_engine_bg.js",
      "./src/server/db/client/wasm-edge-light-loader.mjs",
      "./src/server/db/client/wasm-worker-loader.mjs",
      "./src/server/db/client/wasm.js",
      // User-uploaded files are served statically – exclude from function bundles
      "./public/uploads/**",
      // Browser-only / large client-side packages
      "./node_modules/mermaid/**",
      "./node_modules/@mermaid-js/**",
      "./node_modules/gsap/**",
      "./node_modules/@gsap/**",
      "./node_modules/@xyflow/**",
      "./node_modules/recharts/**",
      "./node_modules/react-zoom-pan-pinch/**",
    ],
  },
  compress: process.env.NODE_ENV === "production",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
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
