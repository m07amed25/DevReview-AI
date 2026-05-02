import { PageBackground } from "@/features/home/components/PageBackground";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { HeroSection } from "@/features/home/components/HeroSection";
import { StatsSection } from "@/features/home/components/StatsSection";
import { FeaturesSection } from "@/features/home/components/FeaturesSection";
import { HowItWorksSection } from "@/features/home/components/HowItWorksSection";
import { LanguagesSection } from "@/features/home/components/LanguagesSection";
import { CtaSection } from "@/features/home/components/CtaSection";
import { HomeFooter } from "@/features/home/components/HomeFooter";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DevReview AI",
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

export default function HomePage() {
  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-50 selection:bg-indigo-500/30 overflow-x-hidden relative">
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

      <HomeHeader />

      <main id="main-content" role="main">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <LanguagesSection />
        <CtaSection />
      </main>

      <HomeFooter />
    </div>
  );
}
