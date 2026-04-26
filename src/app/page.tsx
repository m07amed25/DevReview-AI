"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PageBackground } from "@/features/home/components/PageBackground";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { HeroSection } from "@/features/home/components/HeroSection";
import { StatsSection } from "@/features/home/components/StatsSection";
import { FeaturesSection } from "@/features/home/components/FeaturesSection";
import { HowItWorksSection } from "@/features/home/components/HowItWorksSection";
import { LanguagesSection } from "@/features/home/components/LanguagesSection";
import { CtaSection } from "@/features/home/components/CtaSection";
import { HomeFooter } from "@/features/home/components/HomeFooter";

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        badgeRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      );

      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: "power3.out" },
      );

      gsap.fromTo(
        descRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.4, ease: "power3.out" },
      );

      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.6, ease: "power3.out" },
      );

      gsap.fromTo(
        trustRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.8, ease: "power3.out" },
      );

      gsap.fromTo(
        codeRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.2, delay: 0.5, ease: "power3.out" },
      );

      gsap.to(".orb-1", {
        y: -30,
        x: 20,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".orb-2", {
        y: 30,
        x: -20,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
      });

      gsap.to(".orb-3", {
        y: -20,
        x: 30,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2,
      });

      const statValues = document.querySelectorAll(".stat-value");
      statValues.forEach((stat) => {
        gsap.fromTo(
          stat,
          { opacity: 0, scale: 0.5 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: stat,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      const featureCards = document.querySelectorAll(".feature-card");
      gsap.fromTo(
        featureCards,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featureCards[0],
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      );

      const steps = document.querySelectorAll(".step-card");
      gsap.fromTo(
        steps,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: steps[0],
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );

      const langBadges = document.querySelectorAll(".lang-badge");
      gsap.fromTo(
        langBadges,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: langBadges[0],
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );

      const ctaSection = document.querySelector(".cta-section");
      if (ctaSection) {
        gsap.fromTo(
          ctaSection,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ctaSection,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-50 selection:bg-indigo-500/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
          }),
        }}
      />
      <PageBackground />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>

      <HomeHeader />

      <main ref={heroRef} id="main-content" role="main">
        <HeroSection
          badgeRef={badgeRef}
          headingRef={headingRef}
          descRef={descRef}
          ctaRef={ctaRef}
          trustRef={trustRef}
          codeRef={codeRef}
        />
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
