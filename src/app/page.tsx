import { UnifiedNavbar } from "@/components/unified-navbar";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { LandingContent } from "@/features/home/components/LandingContent";
import { api, HydrateClient } from "@/lib/trpc/server";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Code Catch",
  operatingSystem: "Any",
  applicationCategory: "DeveloperApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Automated code reviews powered by AI. Catch bugs, security issues, and code quality problems instantly.",
  url: "https://code-catch-psi.vercel.app",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  void api.home.getStats.prefetch();
  void api.home.getRecentUsers.prefetch();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-sm"
        >
          Skip to main content
        </a>

        <UnifiedNavbar />

        <main id="main-content">
          <LandingContent />
        </main>

        <HomeFooter />
      </div>
    </HydrateClient>
  );
}
