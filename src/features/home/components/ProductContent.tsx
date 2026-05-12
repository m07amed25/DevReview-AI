"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  GitPullRequest,
  Users,
  BarChart3,
  Shield,
  GitBranch,
  ArrowRight,
  Bot,
  TrendingUp,
  Sparkles,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MermaidPreview } from "./MermaidPreview";

const SAMPLE_SEQUENCE_DIAGRAM = `sequenceDiagram
  participant Dev as 👨‍💻 Developer
  participant GH as 🐙 GitHub
  participant CC as ⚡ Code Catch
  participant AI as 🤖 AI Engine
  participant Team as 👥 Team

  Dev->>GH: git push / open PR
  GH-->>CC: Webhook: pull_request opened
  CC->>AI: Analyse diff + context
  AI-->>CC: Review comments + score
  CC->>GH: Post inline comments
  CC->>Team: 🔔 Notify reviewers
  Team->>GH: Approve or request changes
  GH-->>CC: PR merged
  CC->>CC: Update analytics dashboard`;

const SAMPLE_FLOW_DIAGRAM = `flowchart LR
  PR[📋 Pull Request] --> Fetch[Fetch Diff]
  Fetch --> Lang{Detect Language}
  Lang -- TypeScript --> TS[TS Analyser]
  Lang -- Python --> PY[Python Analyser]
  Lang -- Go --> GO[Go Analyser]
  TS & PY & GO --> AI[🤖 AI Review Engine]
  AI --> Sec[🔒 Security Scan]
  AI --> Style[✨ Style Check]
  AI --> Logic[🧠 Logic Review]
  Sec & Style & Logic --> Score[📊 Quality Score]
  Score --> Post[Post to GitHub]`;

type Accent = "indigo" | "violet" | "cyan" | "rose" | "emerald";

const accentTokens: Record<
  Accent,
  { text: string; dot: string; glow: string; line: string; border: string }
> = {
  indigo: {
    text: "text-indigo-400",
    dot: "bg-indigo-400",
    glow: "bg-indigo-500/20",
    line: "bg-indigo-400/60",
    border: "border-indigo-500/25",
  },
  violet: {
    text: "text-violet-400",
    dot: "bg-violet-400",
    glow: "bg-violet-500/20",
    line: "bg-violet-400/60",
    border: "border-violet-500/25",
  },
  cyan: {
    text: "text-cyan-400",
    dot: "bg-cyan-400",
    glow: "bg-cyan-500/20",
    line: "bg-cyan-400/60",
    border: "border-cyan-500/25",
  },
  rose: {
    text: "text-rose-400",
    dot: "bg-rose-400",
    glow: "bg-rose-500/20",
    line: "bg-rose-400/60",
    border: "border-rose-500/25",
  },
  emerald: {
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    glow: "bg-emerald-500/20",
    line: "bg-emerald-400/60",
    border: "border-emerald-500/25",
  },
};

const features: {
  num: string;
  id: string;
  label: string;
  icon: React.ElementType;
  accent: Accent;
  headlineMain: string;
  headlineAccent: string;
  body: string;
  highlights: string[];
  stat: { value: string; label: string };
  cta: { label: string; href: string };
  image: string | null;
}[] = [
  {
    num: "01",
    id: "review",
    label: "Code Review",
    icon: GitPullRequest,
    accent: "indigo",
    headlineMain: "AI-powered review",
    headlineAccent: "in seconds.",
    body: "Connect your GitHub repository and let Code Catch automatically analyse every pull request — catching bugs, style issues, and bad patterns before they reach production.",
    highlights: [
      "GPT-4 level analysis on every pull request",
      "Inline, actionable suggestions posted on GitHub",
      "Supports 30+ programming languages",
      "Results delivered in under 60 seconds",
    ],
    stat: { value: "60s", label: "Average review time" },
    cta: { label: "Start reviewing", href: "/repo" },
    image: "/review-code-feature.png",
  },
  {
    num: "02",
    id: "teams",
    label: "Teams",
    icon: Users,
    accent: "violet",
    headlineMain: "Code review is",
    headlineAccent: "better together.",
    body: "Invite your whole engineering org. Share repositories, assign reviewers, track team velocity, and keep every developer aligned — all from one place.",
    highlights: [
      "Unlimited team members on any plan",
      "Shared review dashboards across the org",
      "Role-based access control",
      "Team velocity and workload metrics",
    ],
    stat: { value: "3×", label: "Faster review cycles" },
    cta: { label: "Manage teams", href: "/teams" },
    image: "/team-feature1.png",
  },
  {
    num: "03",
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    accent: "cyan",
    headlineMain: "Engineering intelligence,",
    headlineAccent: "built-in.",
    body: "Track PR throughput, reviewer workloads, recurring bug categories, and code quality trends over time. Make data-driven decisions about your engineering process.",
    highlights: [
      "PR throughput and cycle time charts",
      "Per-repository quality score history",
      "Recurring issue pattern detection",
      "Top reviewer leaderboard",
    ],
    stat: { value: "40+", label: "Built-in metrics" },
    cta: { label: "View analytics", href: "/analytics" },
    image: "/analytics-feature.png",
  },
  {
    num: "04",
    id: "security",
    label: "Security",
    icon: Shield,
    accent: "rose",
    headlineMain: "Catch vulnerabilities",
    headlineAccent: "before they ship.",
    body: "Every pull request is automatically scanned for OWASP Top 10 vulnerabilities, leaked secrets, dependency issues, and insecure patterns — keeping your codebase safe by default.",
    highlights: [
      "OWASP Top 10 automatic detection",
      "Secrets and credential scanning",
      "Dependency vulnerability checks",
      "Security score attached to every PR",
    ],
    stat: { value: "99%", label: "Secret detection rate" },
    cta: { label: "Explore security", href: "/security" },
    image: "/security-feature.png",
  },
  {
    num: "05",
    id: "diagrams",
    label: "Diagrams",
    icon: GitBranch,
    accent: "emerald",
    headlineMain: "Architecture diagrams,",
    headlineAccent: "auto-generated.",
    body: "Code Catch reads your repository structure and generates up-to-date architecture, entity-relationship, and sequence diagrams — no manual maintenance ever required.",
    highlights: [
      "Component dependency graphs",
      "ER diagrams from database schema",
      "Sequence flow visualisation",
      "Always synced with your codebase",
    ],
    stat: { value: "Auto", label: "Always up to date" },
    cta: { label: "See diagrams", href: "/repo" },
    image: null,
  },
];

function DiagramsShowcase() {
  const [active, setActive] = useState<"sequence" | "flow">("sequence");

  const tabs: { id: "sequence" | "flow"; label: string; file: string }[] = [
    { id: "sequence", label: "Sequence", file: "pr-review-flow.mmd" },
    { id: "flow", label: "Flow", file: "code-analysis.mmd" },
  ];

  return (
    <div className="w-full">
      {/* Tab strip */}
      <div className="mb-4 flex items-center gap-4 border-b border-zinc-800/60 pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "relative pb-3 text-xs font-medium transition-colors",
              active === t.id ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {t.label}
            {active === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-emerald-400" />
            )}
          </button>
        ))}
        <span className="ml-auto mb-3 flex items-center gap-1.5 font-mono text-[10px] text-zinc-700">
          <FileCode className="size-3" />
          {tabs.find((t) => t.id === active)?.file}
        </span>
      </div>

      {/* Split pane */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="overflow-auto rounded-lg bg-zinc-900/70 p-4">
          <pre className="font-mono text-[11px] leading-relaxed text-zinc-500">
            {(active === "sequence" ? SAMPLE_SEQUENCE_DIAGRAM : SAMPLE_FLOW_DIAGRAM).trim()}
          </pre>
        </div>
        <div className="flex min-h-64 items-center justify-center rounded-lg bg-zinc-900/30 p-4">
          <MermaidPreview
            key={active}
            definition={
              active === "sequence" ? SAMPLE_SEQUENCE_DIAGRAM : SAMPLE_FLOW_DIAGRAM
            }
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export function ProductContent() {
  return (
    <main className="overflow-x-hidden">

      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pb-16 pt-24 text-center">
        {/* Radial glow backdrop */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[55vh] w-[80vw] max-w-3xl -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(99,102,241,0.13),transparent_70%)]" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-violet-500/8 blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-indigo-500/8 blur-[60px]" />
        </div>

        {/* Top hairline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="relative max-w-4xl">
          {/* Eyebrow */}
          <p className="mb-10 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
            <span className="inline-block h-px w-8 bg-indigo-400/50" />
            The complete platform for better code
            <span className="inline-block h-px w-8 bg-indigo-400/50" />
          </p>

          {/* Headline */}
          <h1 className="mb-7 text-5xl font-extrabold leading-[1.04] tracking-tight text-zinc-50 sm:text-6xl md:text-7xl lg:text-[5.25rem]">
            Ship code with
            <br />
            <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              confidence.
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Code Catch connects to GitHub and analyses every pull request —
            surfacing bugs, security vulnerabilities, team insights, and
            architecture diagrams, automatically.
          </p>

          {/* CTAs */}
          <div className="mb-16 flex flex-wrap items-center justify-center gap-5">
            <Link
              href="/repo"
              className="group inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-7 py-3 text-sm font-semibold text-white shadow-[0_0_32px_rgba(99,102,241,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-[0_0_48px_rgba(99,102,241,0.5)]"
            >
              Connect a repo
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
            >
              View pricing
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Feature anchors */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {features.map((f) => {
              const c = accentTokens[f.accent];
              const Icon = f.icon;
              return (
                <a
                  key={f.id}
                  href={`#${f.id}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] opacity-45 transition-opacity hover:opacity-100",
                    c.text,
                  )}
                >
                  <Icon className="size-3" />
                  {f.label}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <div className="border-y border-zinc-800/50">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 divide-x divide-y divide-zinc-800/50 sm:grid-cols-4 sm:divide-y-0">
            {[
              { value: "60s", label: "Average review time" },
              { value: "30+", label: "Languages supported" },
              { value: "99%", label: "Secret detection rate" },
              { value: "10k+", label: "PRs reviewed" },
            ].map((s) => (
              <div key={s.label} className="px-8 py-10 text-center">
                <p className="text-4xl font-black tabular-nums tracking-tight text-zinc-50 sm:text-5xl">
                  {s.value}
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature sections ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        {features.map((feature, i) => {
          const c = accentTokens[feature.accent];
          const Icon = feature.icon;
          const isEven = i % 2 === 0;

          return (
            <section
              key={feature.id}
              id={feature.id}
              className="scroll-mt-24 relative border-b border-zinc-800/40 py-28 sm:py-36"
            >
              {/* Ghost number */}
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 right-0 select-none font-black leading-none text-zinc-900 text-[clamp(6rem,20vw,18rem)]"
              >
                {feature.num}
              </span>

              <div className="relative grid items-center gap-14 md:grid-cols-2 md:gap-24">
                {/* Text block — first in DOM (mobile order), grid-placed on desktop */}
                <div className={isEven ? "" : "md:col-start-2 md:row-start-1"}>
                  {/* Category label */}
                  <p className={cn("mb-6 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em]", c.text)}>
                    <span className={cn("inline-block h-px w-10", c.line)} />
                    {feature.label}
                  </p>

                  {/* Headline */}
                  <h2 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl">
                    {feature.headlineMain}
                    <br />
                    <span className={c.text}>{feature.headlineAccent}</span>
                  </h2>

                  {/* Body */}
                  <p className="mb-8 max-w-lg text-base leading-relaxed text-zinc-400">
                    {feature.body}
                  </p>

                  {/* Highlights */}
                  <ul className="mb-10 space-y-3">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 text-sm text-zinc-300">
                        <span className={cn("mt-1.75 size-1.5 shrink-0 rounded-full", c.dot)} />
                        {h}
                      </li>
                    ))}
                  </ul>

                  {/* Stat + CTA */}
                  <div className="flex items-end gap-10">
                    <div>
                      <div className={cn("mb-2 h-px w-6", c.line)} />
                      <p className={cn("text-5xl font-black tabular-nums leading-none", c.text)}>
                        {feature.stat.value}
                      </p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                        {feature.stat.label}
                      </p>
                    </div>

                    <Link
                      href={feature.cta.href}
                      className={cn(
                        "group mb-1 inline-flex items-center gap-1.5 border-b border-current pb-px text-sm font-medium opacity-60 transition-all hover:opacity-100",
                        c.text,
                      )}
                    >
                      {feature.cta.label}
                      <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>

                {/* Visual block */}
                <div
                  className={cn(
                    "relative flex items-center justify-center",
                    isEven ? "" : "md:col-start-1 md:row-start-1",
                  )}
                >
                  {/* Ambient glow */}
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 -z-10 scale-75 rounded-full blur-[80px] opacity-25",
                      c.glow,
                    )}
                  />

                  {feature.id === "diagrams" ? (
                    <DiagramsShowcase />
                  ) : feature.image ? (
                    <div className={cn("w-full overflow-hidden rounded-2xl border shadow-2xl", c.border)}>
                      {/* App chrome bar */}
                      <div className="flex items-center gap-1.5 border-b border-zinc-800/60 bg-zinc-900/80 px-3 py-2 backdrop-blur-sm">
                        <span className="size-2.5 rounded-full bg-rose-500/60" />
                        <span className="size-2.5 rounded-full bg-amber-500/60" />
                        <span className="size-2.5 rounded-full bg-emerald-500/60" />
                        <div className="ml-2 flex flex-1 items-center rounded bg-zinc-800/50 px-2.5 py-0.5">
                          <span className="font-mono text-[10px] text-zinc-600">codecatch.app</span>
                        </div>
                      </div>
                      {/* Screenshot */}
                      <div className="relative bg-zinc-950">
                        <Image
                          src={feature.image}
                          alt={feature.label}
                          width={800}
                          height={500}
                          className="h-auto w-full object-cover"
                          priority={feature.id === "review"}
                        />
                        {/* Subtle bottom fadeout */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-zinc-950/60 to-transparent" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="relative border-t border-zinc-800/40 py-28 sm:py-36">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 sm:px-8">
          {/* Section label */}
          <p className="mb-6 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-zinc-600">
            <span className="inline-block h-px w-8 bg-zinc-700" />
            How it works
          </p>

          <h2 className="mb-24 text-4xl font-extrabold leading-tight tracking-tight text-zinc-50 sm:text-5xl">
            From push to insight
            <br />
            <span className="text-zinc-600">in seconds.</span>
          </h2>

          {/* Steps */}
          <div className="relative grid gap-16 md:grid-cols-3 md:gap-12">
            {/* Horizontal connector line */}
            <div
              aria-hidden
              className="absolute top-7 left-14 right-14 hidden h-px bg-zinc-800/80 md:block"
            />

            {[
              {
                num: "01",
                icon: GitPullRequest,
                accent: "indigo" as Accent,
                title: "Connect your repo",
                desc: "Authenticate with GitHub and select the repositories you want to monitor. Code Catch installs a webhook and is ready in under two minutes.",
              },
              {
                num: "02",
                icon: Bot,
                accent: "violet" as Accent,
                title: "AI reviews every PR",
                desc: "When a PR opens, Code Catch fetches the diff, runs full AI analysis, and posts inline comments directly on GitHub with a quality score.",
              },
              {
                num: "03",
                icon: TrendingUp,
                accent: "cyan" as Accent,
                title: "Track and improve",
                desc: "Monitor quality scores, team velocity, security issues, and architecture evolution over time — all in one dashboard.",
              },
            ].map(({ num, icon: StepIcon, accent, title, desc }) => {
              const c = accentTokens[accent];
              return (
                <div key={num} className="relative">
                  {/* Icon ring sits on connector line */}
                  <div className="relative z-10 mb-8 flex size-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950">
                    <StepIcon className={cn("size-5", c.text)} />
                  </div>

                  <p className={cn("mb-3 font-mono text-xs uppercase tracking-widest", c.text)}>
                    {num}
                  </p>
                  <h3 className="mb-3 text-lg font-bold text-zinc-100">{title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="border-t border-zinc-800/40">
        <div className="mx-auto max-w-5xl px-6 py-28 sm:px-8 sm:py-36">
          <div className="mb-10 h-px w-16 bg-indigo-400/50" />

          <p className="mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
            <Sparkles className="size-3 text-indigo-400" />
            Free to get started
          </p>

          <h2 className="mb-8 text-5xl font-extrabold leading-tight tracking-tight text-zinc-50 sm:text-6xl md:text-7xl">
            Ready to level up
            <br />
            <span className="text-zinc-600">your code review?</span>
          </h2>

          <p className="mb-12 max-w-lg text-base leading-relaxed text-zinc-400">
            Connect your first repository in under two minutes. No credit card
            required. Start catching issues before they reach production.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/repo"
              className="group inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(99,102,241,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-[0_0_60px_rgba(99,102,241,0.5)]"
            >
              Connect a repository
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
            >
              View pricing
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
