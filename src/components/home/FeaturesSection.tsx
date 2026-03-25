"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  MessageSquare,
  ScanSearch,
  Shield,
  Wand2,
  Zap,
  GitPullRequest,
} from "lucide-react";

const features = [
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
];

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  return (
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
            Focus on building. Let AI handle the repetitive review work while
            you concentrate on what matters.
          </p>
        </div>

        <div
          className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Features"
        >
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card group relative"
              role="listitem"
              onMouseEnter={() => setActiveFeature(index)}
              onMouseLeave={() => setActiveFeature(null)}
            >
              {/* Hover gradient background */}
              <div
                className={`absolute inset-0 bg-linear-to-br from-primary/6 via-transparent to-transparent opacity-0 transition-opacity duration-500 rounded-2xl -z-10 ${
                  activeFeature === index ? "opacity-100" : ""
                }`}
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
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed text-sm">
                  {feature.description}
                </p>

                {/* Learn more link */}
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary opacity-0 transition-all duration-300 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
                >
                  Learn more
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
