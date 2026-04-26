import { serve } from "inngest/next";
import { inngest, functions } from "@/server/inngest";

// Opt out of caching; required for Next.js App Router
export const dynamic = "force-dynamic";

// Increase max duration to prevent timeouts on Vercel
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
