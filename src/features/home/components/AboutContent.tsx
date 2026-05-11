"use client";

import { motion, useInView } from "motion/react";
import { useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Shield,
  Zap,
  Users,
  GitPullRequest,
  Code2,
  Heart,
  Lightbulb,
  Target,
  ArrowRight,
  Github,
  Star,
  CheckCircle2,
  Rocket,
  Globe,
  Lock,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";

function RevealSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */
const values = [
  {
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "group-hover:border-amber-400/30",
    shadow: "group-hover:shadow-amber-400/15",
    title: "Speed Without Compromise",
    description:
      "Reviews should land before the developer switches context. We obsess over latency so feedback is always instant.",
  },
  {
    icon: Shield,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "group-hover:border-emerald-400/30",
    shadow: "group-hover:shadow-emerald-400/15",
    title: "Security First",
    description:
      "Every PR is scanned against OWASP Top-10 and CVE databases. Shipping insecure code is not an option.",
  },
  {
    icon: Lightbulb,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    border: "group-hover:border-indigo-400/30",
    shadow: "group-hover:shadow-indigo-400/15",
    title: "Actionable Insight",
    description:
      "Comments include context, suggested fixes, and links to best practices — not just a lint warning.",
  },
  {
    icon: Heart,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    border: "group-hover:border-pink-400/30",
    shadow: "group-hover:shadow-pink-400/15",
    title: "Developer Love",
    description:
      "We are developers ourselves. Every UX decision is made by people who have felt the pain of bad tooling.",
  },
  {
    icon: Globe,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "group-hover:border-cyan-400/30",
    shadow: "group-hover:shadow-cyan-400/15",
    title: "Inclusive by Default",
    description:
      "From solo open-source maintainers to enterprise teams — our tooling scales to fit every workflow.",
  },
  {
    icon: Lock,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "group-hover:border-violet-400/30",
    shadow: "group-hover:shadow-violet-400/15",
    title: "Privacy You Can Trust",
    description:
      "Your source code never trains our models. We process, review, then discard — your IP stays yours.",
  },
];

const milestones = [
  {
    year: "2024",
    title: "The Problem",
    description:
      "After shipping several products we kept hitting the same wall: code review bottlenecks killing sprint velocity. Manual reviews were slow, inconsistent, and constantly blocked by the same recurring issues.",
    icon: Target,
    color: "text-rose-400",
    dotColor: "bg-rose-400",
  },
  {
    year: "Late 2025",
    title: "The Experiment",
    description:
      "We wired LLM APIs into a GitHub webhook to auto-comment on PRs. The prototype was rough but the signal was unmistakable — reviewers spent 60 % less time on structural issues and focused entirely on logic.",
    icon: Code2,
    color: "text-amber-400",
    dotColor: "bg-amber-400",
  },
  {
    year: "Early 2026",
    title: "Code Catch is Born",
    description:
      "We rebuilt everything from scratch with security scanning, multi-language support, team dashboards, and a real-time notification layer. The MVP shipped to our first 50 beta testers.",
    icon: Rocket,
    color: "text-indigo-400",
    dotColor: "bg-indigo-400",
  },
  {
    year: "2026 →",
    title: "Growing with the Community",
    description:
      "Hundreds of developers and teams joined. We listen to every feature request, fix every edge case, and ship improvements every week. The mission is simple: make every codebase a safer, higher-quality place.",
    icon: Users,
    color: "text-emerald-400",
    dotColor: "bg-emerald-400",
  },
];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${n}+`;
}

function AboutStatsGrid() {
  const [data] = trpc.home.getAboutStats.useSuspenseQuery();

  const stats = [
    { icon: Github, value: formatCount(data.totalRepositories), label: "Repositories Connected" },
    { icon: GitPullRequest, value: formatCount(data.totalReviews), label: "PRs Reviewed" },
    { icon: Star, value: "99.9%", label: "Uptime SLA" },
    { icon: Zap, value: data.avgReviewTime, label: "Avg Review Time" },
  ];

  return (
    <>
      {stats.map((stat, i) => (
        <RevealSection key={stat.label} delay={i * 0.08}>
          <div className="text-center">
            <stat.icon className="mx-auto h-5 w-5 text-indigo-400 mb-3" />
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
          </div>
        </RevealSection>
      ))}
    </>
  );
}

interface TeamMember {
  name: string;
  role: string;
  github: string;
  githubPhoto: string;
  description: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
}

const team: TeamMember[] = [
  {
    name: "Mohamed Reda",
    role: "Founder & Lead Engineer",
    github: "https://github.com/m07amed25",
    githubPhoto: "https://avatars.githubusercontent.com/m07amed25",
    description:
      "Architects the platform end-to-end — from backend APIs and AI pipelines to the interfaces developers interact with every day.",
    twitter: "https://x.com/m07hamed25",
    instagram: "https://www.instagram.com/m07amedr",
    facebook: "https://www.facebook.com/Mohamed.reda.lll/",
    linkedin: "https://www.linkedin.com/in/mhmd-reda-ali/",
  },
  {
    name: "Mohamed Ramy",
    role: "ML & AI Engineer",
    github: "https://github.com/ramymod",
    githubPhoto: "https://avatars.githubusercontent.com/ramymod",
    description:
      "Designs and fine-tunes the AI models that power Code Catch's code analysis, making reviews smarter with every PR.",
    // twitter: "https://twitter.com/placeholder",
    // instagram: "https://instagram.com/placeholder",
    // facebook: "https://facebook.com/placeholder",
    // linkedin: "https://linkedin.com/in/placeholder",
  },
  {
    name: "Mostafa Galal",
    role: "Cross Platform Mobile Developer",
    github: "https://github.com/MG-B17",
    githubPhoto: "https://avatars.githubusercontent.com/MG-B17",
    description:
      "Builds native-quality apps for iOS and Android from a single codebase, keeping performance tight on every device.",
    // twitter: "https://twitter.com/placeholder",
    // instagram: "https://instagram.com/placeholder",
    // facebook: "https://facebook.com/placeholder",
    // linkedin: "https://linkedin.com/in/mohamedreda",
  },
  {
    name: "Shahd Arman",
    role: "Flutter dev & Video Editor",
    github: "https://github.com/shahdarman",
    githubPhoto: "https://avatars.githubusercontent.com/shahdarman",
    description:
      "Crafts smooth cross-platform mobile experiences and produces the visual content that brings Code Catch's story to life.",
    // twitter: "https://twitter.com/placeholder",
    // instagram: "https://instagram.com/placeholder",
    // facebook: "https://facebook.com/placeholder",
    linkedin: "https://www.linkedin.com/in/shahdarman",
  },
  {
    name: "Salma Tarek",
    role: "UI & UX designer",
    github: "https://github.com/Salma935",
    githubPhoto: "https://avatars.githubusercontent.com/Salma935",
    description:
      "Translates complex workflows into clean, intuitive interfaces — ensuring every interaction feels effortless and intentional.",
    // twitter: "https://twitter.com/placeholder",
    // instagram: "https://instagram.com/placeholder",
    // facebook: "https://facebook.com/placeholder",
    // linkedin: "https://linkedin.com/in/placeholder",
  },
  {
    name: "Yassmin Ghaly",
    role: "Security & Graphic Designer",
    github: "https://github.com/Yassmin-Ghaly001",
    githubPhoto: "https://avatars.githubusercontent.com/Yassmin-Ghaly001",
    description:
      "Keeps the platform secure from threats while shaping the visual identity that makes Code Catch recognizable and trustworthy.",
    // twitter: "https://twitter.com/placeholder",
    // instagram: "https://instagram.com/placeholder",
    // facebook: "https://facebook.com/placeholder",
    // linkedin: "https://linkedin.com/in/placeholder",
  },
  // Add team members below — fill in name, role, github, githubPhoto, description
  // {
  //   name: "Placeholder Name",
  //   role: "Placeholder Role",
  //   github: "https://github.com/placeholder",
  //   githubPhoto: "https://avatars.githubusercontent.com/their-username",
  //   description: "Short bio about this team member.",
  // },
];

export function AboutContent() {
  return (
    <main className="dark min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden">
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Gradient orb */}
        <div className="pointer-events-none absolute inset-0 top-[-20%] z-0 h-[80%] w-full bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(120,119,198,0.18),transparent_100%)]" />
        {/* Grid texture */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><path d=%22M0 0h40v40H0z%22 fill=%22none%22 stroke=%22white%22 stroke-width=%220.5%22/></svg>')]" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur-md mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-zinc-300">Our Story</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight"
            style={{ textWrap: "balance" }}
          >
            Built by developers,{" "}
            <span className="bg-linear-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              for developers
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-zinc-400 leading-relaxed font-light"
            style={{ textWrap: "balance" }}
          >
            Code Catch was born from a simple frustration: great code was
            being delayed by slow, inconsistent reviews. We set out to fix
            that — with AI that never sleeps and always has context.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="h-12 px-8 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 font-semibold"
            >
              <Link href="/sign-up">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-12 px-8 rounded-full text-zinc-300 hover:text-white hover:bg-white/5 border border-white/10"
            >
              <Link href="/pricing">View pricing</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-zinc-900/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Suspense fallback={null}>
              <AboutStatsGrid />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <RevealSection>
            <Badge
              variant="outline"
              className="mb-5 border-indigo-500/30 text-indigo-400 bg-indigo-500/10"
            >
              Our Mission
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Raise the bar for{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-violet-400">
                every codebase
              </span>
            </h2>
            <p className="mt-5 text-zinc-400 text-lg leading-relaxed">
              We believe code review is the highest-leverage moment in software
              development — yet it is still largely manual, inconsistent, and
              painfully slow.
            </p>
            <p className="mt-4 text-zinc-400 text-lg leading-relaxed">
              Our mission is to give every developer an always-available AI
              reviewer that catches bugs, surfaces security risks, and provides
              actionable feedback — before a single human reviewer is pulled
              away from building.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Zero configuration GitHub integration",
                "Security scanning on every PR, automatically",
                "Suggestions with context, not just complaints",
                "Works across languages, frameworks, and team sizes",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-zinc-300">
                  <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </RevealSection>

          {/* Visual card */}
          <RevealSection delay={0.15}>
            <div className="relative rounded-2xl border border-white/10 bg-white/3 p-8 overflow-hidden">
              <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />

              <div className="relative space-y-5">
                {/* Fake review card */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Code Catch</p>
                    <p className="text-xs text-zinc-500">just now · auth/login.ts</p>
                  </div>
                  <Badge className="ml-auto text-xs bg-rose-500/15 text-rose-400 border-rose-500/20">
                    Security Risk
                  </Badge>
                </div>

                <div className="rounded-lg bg-zinc-800/60 border border-white/5 p-4 text-sm font-mono text-zinc-300">
                  <span className="text-rose-400">−</span>{" "}
                  <span className="text-zinc-500">const token = req.query.token;</span>
                  <br />
                  <span className="text-emerald-400">+</span>{" "}
                  <span>const token = validateToken(req.query.token);</span>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed">
                  ⚠️ Unsanitized query parameter passed directly to authentication
                  logic. This is vulnerable to injection attacks (OWASP A03:2021).
                  Validate and sanitize before use.
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <Badge variant="outline" className="text-xs border-white/10 text-zinc-500">
                    CWE-20
                  </Badge>
                  <Badge variant="outline" className="text-xs border-white/10 text-zinc-500">
                    OWASP A03
                  </Badge>
                  <span className="ml-auto text-xs text-indigo-400 font-medium">
                    Auto-fix available →
                  </span>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── STORY / TIMELINE ─────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-zinc-900/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <RevealSection className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 border-violet-500/30 text-violet-400 bg-violet-500/10"
            >
              Our Journey
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              How we got here
            </h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto text-lg">
              From a late-night frustration to a product used by hundreds of teams.
            </p>
          </RevealSection>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-white/10 to-transparent hidden sm:block" />

            <div className="space-y-12">
              {milestones.map((milestone, i) => (
                <RevealSection key={milestone.year} delay={i * 0.1}>
                  <div className="flex gap-6 sm:gap-8">
                    {/* Dot + icon */}
                    <div className="relative shrink-0 flex flex-col items-center">
                      <div
                        className={`h-12 w-12 rounded-xl border border-white/10 bg-zinc-800 flex items-center justify-center shadow-lg z-10`}
                      >
                        <milestone.icon className={`h-5 w-5 ${milestone.color}`} />
                      </div>
                      {i < milestones.length - 1 && (
                        <div className="flex-1 w-px bg-white/5 mt-3 sm:hidden" />
                      )}
                    </div>

                    <div className="pb-2">
                      <span
                        className={`inline-block text-xs font-bold uppercase tracking-widest mb-2 ${milestone.color}`}
                      >
                        {milestone.year}
                      </span>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-zinc-400 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <RevealSection className="text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4 border-indigo-500/30 text-indigo-400 bg-indigo-500/10"
          >
            What We Stand For
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Principles that guide{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">
              every decision
            </span>
          </h2>
        </RevealSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((value, i) => (
            <RevealSection key={value.title} delay={i * 0.07}>
              <div
                className={`group relative h-full rounded-2xl border border-white/5 bg-white/2 p-6 transition-all duration-300 hover:bg-white/4 hover:border-white/10 hover:shadow-xl ${value.shadow} ${value.border}`}
              >
                <div
                  className={`h-10 w-10 rounded-xl ${value.bg} flex items-center justify-center mb-4`}
                >
                  <value.icon className={`h-5 w-5 ${value.color}`} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {value.description}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 bg-zinc-900/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <RevealSection className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 border-pink-500/30 text-pink-400 bg-pink-500/10"
            >
              The Team
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              The people building it
            </h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto text-lg">
              A small, focused team with a big goal — making code review fast,
              thorough, and painless for every developer on the planet.
            </p>
          </RevealSection>

          <div className={`grid gap-5 justify-center ${team.length === 1 ? "max-w-sm mx-auto" : team.length === 2 ? "sm:grid-cols-2 max-w-2xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {team.map((member, i) => (
              <RevealSection key={member.name} delay={i * 0.1}>
                <div className="group rounded-2xl border border-white/5 bg-white/2 p-8 text-center transition-all duration-300 hover:bg-white/4 hover:border-white/10 hover:shadow-xl hover:shadow-indigo-500/10">
                  {/* Avatar from GitHub */}
                  <div className="mx-auto h-20 w-20 rounded-2xl overflow-hidden ring-2 ring-white/10 mb-5 shadow-lg">
                    <Image
                      src={member.githubPhoto}
                      alt={member.name}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white">{member.name}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-indigo-400 font-medium truncate">
                      {member.role}
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                  {/* Social links */}
                  <div className="flex items-center justify-center gap-3 mt-5">
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-white transition-colors"
                      aria-label={`${member.name} GitHub profile`}
                    >
                      <Github className="h-4 w-4" />
                    </a>
                    {member.twitter && (
                      <a
                        href={member.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-sky-400 transition-colors"
                        aria-label={`${member.name} Twitter profile`}
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {member.instagram && (
                      <a
                        href={member.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-pink-400 transition-colors"
                        aria-label={`${member.name} Instagram profile`}
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {member.facebook && (
                      <a
                        href={member.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-blue-400 transition-colors"
                        aria-label={`${member.name} Facebook profile`}
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-blue-500 transition-colors"
                        aria-label={`${member.name} LinkedIn profile`}
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>

          {/* Hiring callout */}
          <RevealSection delay={0.2} className="mt-12">
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center bg-white/1">
              <p className="text-zinc-400 text-sm uppercase tracking-widest font-medium mb-2">
                We&apos;re growing
              </p>
              <h3 className="text-xl font-bold text-white mb-3">
                Want to shape the future of code review?
              </h3>
              <p className="text-zinc-400 max-w-md mx-auto mb-6">
                We are always looking for passionate engineers, designers, and
                developer advocates. Reach out — let&apos;s build something great together.
              </p>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/15 hover:bg-white/5 text-white"
              >
                <a href="mailto:codecatch27@gmail.com">
                  Say hello
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_120%,rgba(120,119,198,0.25),transparent_100%)]" />
        <div className="pointer-events-none absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <RevealSection>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300">
              <Sparkles className="h-4 w-4" />
              <span>Start reviewing smarter today</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
              Ready to{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-blue-400 to-cyan-400">
                ship better code?
              </span>
            </h2>

            <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Connect your GitHub repository and get your first AI-powered review in
              under two minutes. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-14 px-10 text-base rounded-full bg-white text-zinc-900 hover:bg-zinc-100 font-bold shadow-[0_0_40px_rgba(255,255,255,0.1)]"
              >
                <Link href="/sign-up">
                  <Github className="mr-2 h-5 w-5" />
                  Connect GitHub — it&apos;s free
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-14 px-10 text-base rounded-full text-zinc-300 hover:text-white hover:bg-white/5 border border-white/10"
              >
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </RevealSection>
        </div>
      </section>
    </main>
  );
}
