"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  GitPullRequest,
  GitMerge,
  MessageSquare,
  ScanSearch,
  Shield,
  Wand2,
  Zap,
  Code2,
  Users,
  Clock,
  Sparkles,
  Terminal,
  FileCode,
  Github,
  Star,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  AuroraBackground,
  GridBackground,
  BlobBackground,
} from "@/components/animations/backgrounds";

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Hero section animations
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

      // Background orbs floating animation
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

      // Stats counter animation with scroll trigger
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

      // Features cards animation with scroll trigger
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

      // How it works steps animation
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

      // Language badges animation
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

      // CTA section animation
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
    <div className="min-h-screen bg-background">
      {/* Enhanced animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {/* Aurora effect */}
        <AuroraBackground />

        {/* Grid pattern overlay */}
        <GridBackground />

        {/* Animated orbs */}
        <div className="orb-1 absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px] animate-pulse" />
        <div
          className="orb-2 absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[100px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="orb-3 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/3 blur-[150px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      </div>

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40"
        role="banner"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight hover:opacity-80 transition-all duration-200 group"
            aria-label="CodeReviewAI - Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-primary/40">
              <Code2 className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg">CodeReviewAI</span>
          </Link>

          <nav
            className="flex items-center gap-1"
            role="navigation"
            aria-label="Main navigation"
          >
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:inline-flex"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="shadow-lg shadow-primary/20">
              <Link href="/sign-up">
                Get started
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main ref={heroRef} id="main-content" role="main">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden"
          aria-labelledby="hero-heading"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 text-center">
            {/* Badge with animation */}
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm backdrop-blur-sm mb-8"
            >
              <Sparkles
                className="h-3.5 w-3.5 text-amber-500"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">
                Powered by advanced AI models
              </span>
              <Badge variant="secondary" className="ml-1 text-xs font-medium">
                New
              </Badge>
            </div>

            {/* Main heading with gradient */}
            <h1
              ref={headingRef}
              id="hero-heading"
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Ship better code,
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                faster
              </span>
            </h1>

            {/* Description */}
            <p
              ref={descRef}
              className="mx-auto mt-6 max-w-2.5xl text-lg text-muted-foreground leading-relaxed"
            >
              Automated code reviews that catch bugs, security issues, and
              maintainability problems before they reach production. Save hours
              on every pull request.
            </p>

            {/* CTA Buttons */}
            <div
              ref={ctaRef}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="h-12 px-8 text-base w-full sm:w-auto shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                asChild
              >
                <Link href="/sign-up">
                  Start for free
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base w-full sm:w-auto hover:bg-muted/80 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                asChild
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div
              ref={trustRef}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
              role="list"
              aria-label="Features"
            >
              <span className="flex items-center gap-2" role="listitem">
                <CheckCircle
                  className="h-4 w-4 text-emerald-500"
                  aria-hidden="true"
                />
                <span>Free forever plan</span>
              </span>
              <span className="flex items-center gap-2" role="listitem">
                <CheckCircle
                  className="h-4 w-4 text-emerald-500"
                  aria-hidden="true"
                />
                <span>GitHub integration</span>
              </span>
              <span className="flex items-center gap-2" role="listitem">
                <CheckCircle
                  className="h-4 w-4 text-emerald-500"
                  aria-hidden="true"
                />
                <span>Private repos</span>
              </span>
            </div>
          </div>

          {/* Code Preview */}
          <div
            ref={codeRef}
            className="mx-auto max-w-4xl px-4 sm:px-6 pb-16 sm:pb-20"
          >
            <div className="relative rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/5">
              {/* Window controls */}
              <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3.5 bg-muted/20">
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label="Window controls"
                >
                  <div className="h-3.5 w-3.5 rounded-full bg-red-500/90 shadow-sm" />
                  <div className="h-3.5 w-3.5 rounded-full bg-yellow-500/90 shadow-sm" />
                  <div className="h-3.5 w-3.5 rounded-full bg-green-500/90 shadow-sm" />
                </div>
                <span className="ml-4 text-xs text-muted-foreground font-mono">
                  pull_request.ts
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-muted-foreground/60 hidden sm:inline">
                    AI Review
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-1.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  >
                    Ready
                  </Badge>
                </div>
              </div>

              {/* Code content */}
              <div
                className="p-5 sm:p-6 font-mono text-sm overflow-x-auto"
                role="img"
                aria-label="Code review example"
              >
                <div className="space-y-1">
                  <div className="text-muted-foreground">
                    <span className="text-blue-400">const</span> review ={" "}
                    <span className="text-yellow-400">await</span> ai.
                    <span className="text-blue-400">reviewCode</span>({"{"}
                  </div>
                  <div className="pl-4 text-muted-foreground">
                    pullRequest: pr,
                  </div>
                  <div className="pl-4 text-muted-foreground">
                    includeSecurity: <span className="text-blue-400">true</span>
                    ,
                  </div>
                  <div className="pl-4 text-muted-foreground">
                    includePerformance:{" "}
                    <span className="text-blue-400">true</span>
                  </div>
                  <div className="text-muted-foreground">{"}"});</div>
                </div>

                {/* AI Response */}
                <div className="mt-5 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2 text-emerald-400 mb-3">
                    <Sparkles
                      className="h-4 w-4 animate-pulse"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium">
                      AI Analysis Complete
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-yellow-400 mt-0.5">●</span>
                      <span>
                        <span className="text-yellow-400 font-medium">
                          Security:
                        </span>{" "}
                        Potential SQL injection in line 42
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-blue-400 mt-0.5">●</span>
                      <span>
                        <span className="text-blue-400 font-medium">
                          Performance:
                        </span>{" "}
                        Unnecessary re-render in component
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-purple-400 mt-0.5">●</span>
                      <span>
                        <span className="text-purple-400 font-medium">
                          Style:
                        </span>{" "}
                        Consider using const instead of let
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div
              className="absolute -right-2 top-1/4 hidden lg:block animate-bounce"
              style={{ animationDuration: "3s" }}
            >
              <div className="bg-card border border-border/60 rounded-lg px-3 py-2 shadow-xl shadow-black/10 flex items-center gap-2">
                <Star
                  className="h-4 w-4 text-amber-500 fill-amber-500"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">98% accuracy</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section
          ref={statsRef}
          className="border-y border-border/40 bg-muted/15"
          aria-labelledby="stats-heading"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div
              className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4"
              role="list"
              aria-label="Platform statistics"
            >
              {[
                { value: "50K+", label: "PRs Reviewed", icon: GitPullRequest },
                { value: "2M+", label: "Lines Analyzed", icon: FileCode },
                { value: "10K+", label: "Developers", icon: Users },
                { value: "99.9%", label: "Uptime", icon: Clock },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center group"
                  role="listitem"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                    <stat.icon
                      className="h-5 w-5 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="stat-value text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className="border-b border-border/40"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
            <div className="text-center mb-12 sm:mb-14">
              <h2
                id="features-heading"
                className="text-3xl sm:text-4xl font-bold tracking-tight"
              >
                Everything you need for better reviews
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Focus on building. Let AI handle the repetitive review work
                while you concentrate on what matters.
              </p>
            </div>

            <div
              className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label="Features"
            >
              {[
                {
                  icon: Zap,
                  title: "Instant feedback",
                  description:
                    "Get comprehensive reviews in seconds, not hours. No more waiting for team availability.",
                  color: "amber",
                },
                {
                  icon: Shield,
                  title: "Security scanning",
                  description:
                    "Detect vulnerabilities, secrets, and security anti-patterns before they become problems.",
                  color: "red",
                },
                {
                  icon: MessageSquare,
                  title: "Clear suggestions",
                  description:
                    "Actionable feedback with code examples you can apply immediately.",
                  color: "blue",
                },
                {
                  icon: GitPullRequest,
                  title: "PR integration",
                  description:
                    "Reviews appear right in your GitHub pull requests with inline comments.",
                  color: "purple",
                },
                {
                  icon: ScanSearch,
                  title: "Context aware",
                  description:
                    "Understands your codebase patterns, conventions, and architecture.",
                  color: "emerald",
                },
                {
                  icon: Wand2,
                  title: "Always improving",
                  description:
                    "Powered by the latest AI models, continuously learning and evolving.",
                  color: "pink",
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="feature-card group relative"
                  role="listitem"
                  onMouseEnter={() => setActiveFeature(index)}
                  onMouseLeave={() => setActiveFeature(null)}
                >
                  {/* Hover gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent opacity-0 transition-opacity duration-500 rounded-2xl -z-10 ${activeFeature === index ? "opacity-100" : ""}`}
                  />

                  <div className="relative p-5 rounded-2xl border border-transparent transition-all duration-300 hover:border-border/60">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-${feature.color}-500/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-${feature.color}-500/20`}
                    >
                      <feature.icon
                        className={`h-5 w-5 text-${feature.color}-500`}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed text-sm">
                      {feature.description}
                    </p>

                    {/* Learn more link */}
                    <Link
                      href="/sign-up"
                      className={`inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary opacity-0 transition-all duration-300 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0`}
                    >
                      Learn more
                      <ArrowUpRight
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section
          className="border-b border-border/40 bg-muted/25"
          aria-labelledby="how-it-works-heading"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
            <div className="text-center mb-12 sm:mb-14">
              <h2
                id="how-it-works-heading"
                className="text-3xl sm:text-4xl font-bold tracking-tight"
              >
                Up and running in minutes
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to transform your code review process.
              </p>
            </div>

            <div
              className="grid gap-8 sm:grid-cols-3"
              role="list"
              aria-label="How it works steps"
            >
              {[
                {
                  step: "01",
                  icon: Github,
                  title: "Connect GitHub",
                  description:
                    "Sign up and authorize access to your repositories in one click.",
                },
                {
                  step: "02",
                  icon: Terminal,
                  title: "Open a PR",
                  description:
                    "CodeReviewAI automatically triggers on every pull request in your repo.",
                },
                {
                  step: "03",
                  icon: GitMerge,
                  title: "Merge with confidence",
                  description:
                    "Review AI feedback, apply suggestions, and ship better code.",
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="step-card relative group"
                  role="listitem"
                >
                  {/* Step number */}
                  <div className="text-7xl font-bold text-primary/[0.08] absolute -top-3 -left-1 select-none group-hover:text-primary/[0.12] transition-colors duration-300">
                    {item.step}
                  </div>

                  {/* Content */}
                  <div className="relative pt-10">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/10">
                      <item.icon
                        className="h-6 w-6 text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed text-sm">
                      {item.description}
                    </p>
                  </div>

                  {/* Connector line */}
                  {index < 2 && (
                    <div className="hidden sm:block absolute top-[60px] left-[calc(50%+35px)] w-[calc(100%-70px)] h-px bg-gradient-to-r from-primary/20 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Languages supported */}
        <section
          className="border-b border-border/40"
          aria-labelledby="languages-heading"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
            <div className="text-center mb-12 sm:mb-14">
              <h2
                id="languages-heading"
                className="text-2xl sm:text-3xl font-semibold tracking-tight"
              >
                Supports 50+ languages
              </h2>
              <p className="mt-2 text-muted-foreground">
                From JavaScript to Rust, we&apos;ve got you covered.
              </p>
            </div>

            <div
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
              role="list"
              aria-label="Supported programming languages"
            >
              {[
                { name: "JavaScript", color: "yellow" },
                { name: "TypeScript", color: "blue" },
                { name: "Python", color: "green" },
                { name: "Go", color: "cyan" },
                { name: "Rust", color: "orange" },
                { name: "Java", color: "red" },
                { name: "C++", color: "blue" },
                { name: "Ruby", color: "red" },
                { name: "PHP", color: "purple" },
                { name: "Swift", color: "orange" },
                { name: "Kotlin", color: "purple" },
                { name: "Scala", color: "red" },
              ].map((lang) => (
                <span
                  key={lang.name}
                  className="lang-badge px-4 py-2 rounded-full bg-muted/50 border border-border/60 text-sm font-medium transition-all duration-200 hover:scale-105 hover:bg-muted/80 hover:border-primary/30 cursor-default hover:shadow-lg hover:shadow-primary/10"
                  role="listitem"
                >
                  {lang.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="cta-section relative overflow-hidden"
          aria-labelledby="cta-heading"
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_var(--primary)/5,_transparent_50%)]"
            aria-hidden="true"
          />

          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center relative">
            <h2
              id="cta-heading"
              className="text-3xl sm:text-4xl font-bold tracking-tight"
            >
              Ready to improve your code reviews?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of developers who ship better code, faster. Start
              free, upgrade when your team needs more.
            </p>

            <Button
              size="lg"
              className="mt-8 h-12 px-8 text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              asChild
            >
              <Link href="/sign-up">
                Get started for free
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Link>
            </Button>

            {/* Social proof */}
            <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium"
                    aria-hidden="true"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>Join 10,000+ developers</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t border-border/40 bg-muted/20"
        role="contentinfo"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <span className="font-semibold">CodeReviewAI</span>
            </div>

            <nav aria-label="Footer navigation">
              <ul className="flex items-center gap-6 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/sign-in"
                    className="hover:text-foreground transition-colors duration-200 focus:outline-none focus:text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-sm"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sign-up"
                    className="hover:text-foreground transition-colors duration-200 focus:outline-none focus:text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-sm"
                  >
                    Get started
                  </Link>
                </li>
              </ul>
            </nav>

            <span className="text-sm text-muted-foreground">
              © 2025 CodeReviewAI
            </span>
          </div>

          {/* Developer Credit */}
          <div className="mt-6 pt-6 border-t border-border/30 text-center">
            <p className="text-sm text-muted-foreground">
              Developed by{" "}
              <a
                href="mailto:m07hamedreda25@gmail.com"
                className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              >
                Mohamed Reda
              </a>{" "}
              -{" "}
              <a
                href="mailto:m07hamedreda25@gmail.com"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                m07hamedreda25@gmail.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
