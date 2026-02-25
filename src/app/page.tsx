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
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div
          className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl animate-pulse"
          style={{ animationDuration: "6s" }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Code2 className="h-4 w-4" />
            </div>
            CodeReviewAI
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32 lg:py-40">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm backdrop-blur-sm mb-8">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Powered by advanced AI models</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
              Ship better code,
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                faster
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Automated code reviews that catch bugs, security issues, and
              maintainability problems before they reach production. Save hours
              on every pull request.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-12 px-8 text-base w-full sm:w-auto"
                asChild
              >
                <Link href="/sign-up">
                  Start for free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base w-full sm:w-auto"
                asChild
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Free forever plan
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                GitHub integration
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Private repos
              </span>
            </div>
          </div>

          {/* Code Preview */}
          <div className="mx-auto max-w-4xl px-6 pb-16">
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <span className="ml-4 text-xs text-muted-foreground">
                  pull_request.ts
                </span>
              </div>
              <div className="p-6 font-mono text-sm overflow-x-auto">
                <div className="text-muted-foreground">
                  <span className="text-blue-400">const</span> review ={" "}
                  <span className="text-yellow-400">await</span> ai.
                  <span className="text-blue-400">reviewCode</span>({"{"}
                </div>
                <div className="pl-4 text-muted-foreground">
                  pullRequest: pr,
                </div>
                <div className="pl-4 text-muted-foreground">
                  includeSecurity: <span className="text-blue-400">true</span>,
                </div>
                <div className="pl-4 text-muted-foreground">
                  includePerformance:{" "}
                  <span className="text-blue-400">true</span>
                </div>
                <div className="text-muted-foreground">{"}"});</div>
                <div className="mt-2" />
                <div className="text-emerald-400">{"// ✓ Found 2 issues"}</div>
                <div className="text-muted-foreground">
                  - <span className="text-yellow-400">Security:</span> Potential
                  SQL injection in line 42
                </div>
                <div className="text-muted-foreground">
                  - <span className="text-blue-400">Performance:</span>{" "}
                  Unnecessary re-render in component
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border/40 bg-muted/20">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { value: "50K+", label: "PRs Reviewed", icon: GitPullRequest },
                { value: "2M+", label: "Lines Analyzed", icon: FileCode },
                { value: "10K+", label: "Developers", icon: Users },
                { value: "99.9%", label: "Uptime", icon: Clock },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="mx-auto h-5 w-5 text-primary mb-2 opacity-60" />
                  <div className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-border/40">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need for better reviews
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Focus on building. Let AI handle the repetitive review work
                while you concentrate on what matters.
              </p>
            </div>

            <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "Instant feedback",
                  description:
                    "Get comprehensive reviews in seconds, not hours. No more waiting for team availability.",
                },
                {
                  icon: Shield,
                  title: "Security scanning",
                  description:
                    "Detect vulnerabilities, secrets, and security anti-patterns before they become problems.",
                },
                {
                  icon: MessageSquare,
                  title: "Clear suggestions",
                  description:
                    "Actionable feedback with code examples you can apply immediately.",
                },
                {
                  icon: GitPullRequest,
                  title: "PR integration",
                  description:
                    "Reviews appear right in your GitHub pull requests with inline comments.",
                },
                {
                  icon: ScanSearch,
                  title: "Context aware",
                  description:
                    "Understands your codebase patterns, conventions, and architecture.",
                },
                {
                  icon: Wand2,
                  title: "Always improving",
                  description:
                    "Powered by the latest AI models, continuously learning and evolving.",
                },
              ].map((feature) => (
                <div key={feature.title} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 rounded-lg" />
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-border/40 bg-muted/30">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Up and running in minutes
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to transform your code review process.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: GitBranch,
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
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="text-6xl font-bold text-primary/10 absolute -top-2 -left-2">
                    {item.step}
                  </div>
                  <div className="relative pt-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Languages supported */}
        <section className="border-b border-border/40">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-semibold tracking-tight">
                Supports 50+ languages
              </h2>
              <p className="mt-2 text-muted-foreground">
                From JavaScript to Rust, we&apos;ve got you covered.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              {[
                "JavaScript",
                "TypeScript",
                "Python",
                "Go",
                "Rust",
                "Java",
                "C++",
                "Ruby",
                "PHP",
                "Swift",
                "Kotlin",
                "Scala",
              ].map((lang) => (
                <span
                  key={lang}
                  className="px-4 py-2 rounded-full bg-muted/50 border border-border"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="mx-auto max-w-2xl px-6 py-24 text-center relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to improve your code reviews?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of developers who ship better code, faster. Start
              free, upgrade when your team needs more.
            </p>
            <Button size="lg" className="mt-8 h-12 px-8 text-base" asChild>
              <Link href="/sign-up">
                Get started for free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                <Code2 className="h-3 w-3" />
              </div>
              <span className="font-semibold">CodeReviewAI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                href="/sign-in"
                className="hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="hover:text-foreground transition-colors"
              >
                Get started
              </Link>
            </div>
            <span className="text-sm text-muted-foreground">
              © 2025 CodeReviewAI
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
