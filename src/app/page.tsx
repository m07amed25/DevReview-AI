"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import { PageBackground } from "@/features/home/components/PageBackground";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { HeroSection } from "@/features/home/components/HeroSection";
import { StatsSection } from "@/features/home/components/StatsSection";
import { FeaturesSection } from "@/features/home/components/FeaturesSection";
import { HowItWorksSection } from "@/features/home/components/HowItWorksSection";
import { LanguagesSection } from "@/features/home/components/LanguagesSection";
import { CtaSection } from "@/features/home/components/CtaSection";
import { HomeFooter } from "@/features/home/components/HomeFooter";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingScrubRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const codeScrubRef = useRef<HTMLDivElement>(null);
  const bigTextRef = useRef<HTMLDivElement>(null);

  // Sync GSAP ScrollTrigger with Lenis
  useLenis(ScrollTrigger.update);

  useGSAP(
    () => {
      gsap.ticker.lagSmoothing(0);

      // 1. Initial entry animations (Timeline)
      const tl = gsap.timeline();
      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      )
        .fromTo(
          headingRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
          "-=0.6",
        )
        .fromTo(
          descRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
          "-=0.8",
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
          "-=0.8",
        )
        .fromTo(
          trustRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
          "-=0.8",
        )
        .fromTo(
          codeRef.current,
          { opacity: 0, y: 100, rotateX: 15, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 1.5,
            ease: "expo.out",
          },
          "-=1",
        );

      // 2. Scroll Scrub: Hero Section Parallax (Using Wrappers)
      gsap.to(codeScrubRef.current, {
        scrollTrigger: {
          trigger: heroSectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
        y: -100,
        rotateX: 20,
        rotateY: -5,
        scale: 1.02,
        opacity: 0.4,
        ease: "none",
      });

      gsap.to(headingScrubRef.current, {
        scrollTrigger: {
          trigger: heroSectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
        y: 100,
        scale: 0.9,
        ease: "none",
      });

      // 3. Massive background text parallax
      gsap.fromTo(
        bigTextRef.current,
        { x: "100%" },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
          x: "-50%",
          ease: "none",
        },
      );

      // Orbs floating animations
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

      // 4. Statistics counter-like entrance
      const statValues = gsap.utils.toArray<HTMLElement>(".stat-value");
      statValues.forEach((stat) => {
        gsap.fromTo(
          stat,
          { opacity: 0, scale: 0.5, rotateX: 90 },
          {
            opacity: 1,
            scale: 1,
            rotateX: 0,
            duration: 1,
            ease: "elastic.out(1, 0.5)",
            scrollTrigger: {
              trigger: stat,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      // 5. Features stagger
      const featureCards = gsap.utils.toArray(".feature-card");
      if (featureCards.length > 0) {
        gsap.fromTo(
          featureCards,
          { opacity: 0, y: 100, rotateY: 30 },
          {
            opacity: 1,
            y: 0,
            rotateY: 0,
            stagger: 0.1,
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: {
              trigger: ".features-grid",
              start: "top 80%",
              end: "bottom 20%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      // 6. Steps drawing line scrub
      gsap.fromTo(
        ".step-line-progress",
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".steps-container",
            start: "top center",
            end: "bottom center",
            scrub: true,
          },
        },
      );

      const steps = gsap.utils.toArray<HTMLElement>(".step-card");
      steps.forEach((step) => {
        gsap.fromTo(
          step,
          { opacity: 0, y: 50, scale: 0.8 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "back.out(1.5)",
            scrollTrigger: {
              trigger: step,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      // 7. Language badges stagger
      const langBadges = gsap.utils.toArray(".lang-badge");
      if (langBadges.length > 0) {
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
              trigger: ".languages-section",
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      // 8. CTA Section entrance
      gsap.fromTo(
        ".cta-section",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".cta-section",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: containerRef },
  );

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

  return (
    <div
      ref={containerRef}
      className="dark min-h-screen bg-zinc-950 text-zinc-50 selection:bg-indigo-500/30 overflow-x-hidden relative"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageBackground />

      {/* Massive parallax background text */}
      <div
        ref={bigTextRef}
        className="fixed top-[30%] left-0 z-0 text-[30vw] font-black tracking-tighter text-zinc-800/40 whitespace-nowrap pointer-events-none select-none"
        style={{ willChange: "transform" }}
      >
        DEVREVIEW AI
      </div>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>

      <HomeHeader />

      <main id="main-content" role="main">
        <HeroSection
          badgeRef={badgeRef}
          headingRef={headingRef}
          headingScrubRef={headingScrubRef}
          descRef={descRef}
          ctaRef={ctaRef}
          trustRef={trustRef}
          codeRef={codeRef}
          codeScrubRef={codeScrubRef}
          sectionRef={heroSectionRef}
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
