import { PageBackground } from "@/features/home/components/PageBackground";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { HeroSection } from "@/features/home/components/HeroSection";
import { StatsSection } from "@/features/home/components/StatsSection";
import { FeaturesSection } from "@/features/home/components/FeaturesSection";
import { HowItWorksSection } from "@/features/home/components/HowItWorksSection";
import { LanguagesSection } from "@/features/home/components/LanguagesSection";
import { DocsSection } from "@/features/home/components/DocsSection";
import { CtaSection } from "@/features/home/components/CtaSection";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { AnnouncementBanner } from "@/features/home/components/AnnouncementBanner";
import { api, HydrateClient } from "@/lib/trpc/server";
import { Suspense } from "react";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Code Catch",
  operatingSystem: "Any",
  applicationCategory: "DeveloperApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Automated code reviews powered by AI. Catch bugs, security issues, and code quality problems instantly directly in your GitHub pull requests.",
  url: "https://dev-review-ai-chi.vercel.app",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  void api.home.getStats.prefetch();
  void api.home.getRecentUsers.prefetch();
  const banner = await api.admin.getBannerSettings();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30 overflow-x-hidden relative">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <PageBackground />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
        >
          Skip to main content
        </a>

        {banner.enabled && (
          <AnnouncementBanner
            text={banner.text}
            link={banner.link}
            linkText={banner.linkText}
            color={banner.color}
          />
        )}

        <UnifiedNavbar />

        <main id="main-content" role="main">
          <HeroSection />
          <Suspense fallback={null}><StatsSection /></Suspense>
          <FeaturesSection />
          <HowItWorksSection />
          <LanguagesSection />
          <DocsSection />
          <Suspense fallback={null}><CtaSection /></Suspense>
        </main>

        <HomeFooter />
      </div>
    </HydrateClient>
  );
}
