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

type ColorKey = "amber" | "red" | "blue" | "purple" | "emerald" | "pink";

const colorStyles: Record<
  ColorKey,
  { bg: string; text: string; shadow: string; border: string }
> = {
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    shadow: "group-hover:shadow-amber-500/20",
    border: "group-hover:border-amber-500/30",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    shadow: "group-hover:shadow-red-500/20",
    border: "group-hover:border-red-500/30",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    shadow: "group-hover:shadow-blue-500/20",
    border: "group-hover:border-blue-500/30",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    shadow: "group-hover:shadow-purple-500/20",
    border: "group-hover:border-purple-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    shadow: "group-hover:shadow-emerald-500/20",
    border: "group-hover:border-emerald-500/30",
  },
  pink: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    shadow: "group-hover:shadow-pink-500/20",
    border: "group-hover:border-pink-500/30",
  },
};

const features = [
  {
    icon: Zap,
    title: "Instant feedback",
    description:
      "Get comprehensive reviews in seconds, not hours. No more waiting for team availability.",
    color: "amber" as ColorKey,
  },
  {
    icon: Shield,
    title: "Security scanning",
    description:
      "Detect vulnerabilities, secrets, and security anti-patterns before they become problems.",
    color: "red" as ColorKey,
  },
  {
    icon: MessageSquare,
    title: "Clear suggestions",
    description:
      "Actionable feedback with code examples you can apply immediately to your branch.",
    color: "blue" as ColorKey,
  },
  {
    icon: GitPullRequest,
    title: "PR integration",
    description:
      "Reviews appear right in your GitHub pull requests with inline comments just like a human reviewer.",
    color: "purple" as ColorKey,
  },
  {
    icon: ScanSearch,
    title: "Context aware",
    description:
      "Understands your codebase patterns, conventions, and architecture out of the box.",
    color: "emerald" as ColorKey,
  },
  {
    icon: Wand2,
    title: "Always improving",
    description:
      "Powered by the latest AI models, continuously learning and evolving with new frameworks.",
    color: "pink" as ColorKey,
  },
];

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  return (
    <section
      className="relative border-t border-white/5 bg-zinc-950"
      aria-labelledby="features-heading"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16 sm:mb-20">
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-100"
          >
            Everything you need for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-100">
              better reviews
            </span>
          </h2>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Focus on building. Let our specialized AI agent handle the
            repetitive review work while you concentrate on shipping features
            that matter.
          </p>
        </div>

        <div
          className="features-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Features"
        >
          {features.map((feature, index) => {
            const styles = colorStyles[feature.color];
            return (
              <div
                key={feature.title}
                className={`feature-card group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-500 hover:bg-white/[0.04] ${styles.border}`}
                role="listitem"
                onMouseEnter={() => setActiveFeature(index)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                {/* Glow effect */}
                <div
                  className={`absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  style={{
                    background: `radial-gradient(600px circle at ${activeFeature === index ? "50% 100%" : "50% 50%"}, rgba(255,255,255,0.06), transparent 40%)`,
                  }}
                />

                <div className="relative z-10">
                  <div
                    className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${styles.bg} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${styles.shadow}`}
                  >
                    <feature.icon
                      className={`h-6 w-6 ${styles.text}`}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-200 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-sm">
                    {feature.description}
                  </p>

                  {/* Learn more link */}
                  <Link
                    href="/sign-up"
                    className={`inline-flex items-center gap-1 mt-6 text-sm font-medium ${styles.text} opacity-0 transition-all duration-300 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0`}
                  >
                    Learn more
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
