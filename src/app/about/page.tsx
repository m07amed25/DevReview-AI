import type { Metadata } from "next";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { AboutContent } from "@/features/home/components/AboutContent";
import { api, HydrateClient } from "@/lib/trpc/server";

export const metadata: Metadata = {
  title: "About Us - Code Catch",
  description:
    "Learn about the team behind Code Catch, our mission, and why we built AI-powered code review for GitHub pull requests.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  void api.home.getAboutStats.prefetch();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-background text-foreground">
        <UnifiedNavbar />
        <AboutContent />
        <HomeFooter />
      </div>
    </HydrateClient>
  );
}
