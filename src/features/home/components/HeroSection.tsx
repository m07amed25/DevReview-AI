"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Sparkles,
  GitMerge,
  FileCode,
  Check,
  Command,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import { SplittingText } from "@/components/animate-ui/primitives/texts/splitting";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";

export function HeroSection() {
  const { data: session } = useSession();

  return (
    <section
      className="relative overflow-hidden pt-24 sm:pt-32 lg:pt-40"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 top-[-20%] z-0 h-[80%] w-full bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(120,119,198,0.15),transparent_100%)]"></div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-sm backdrop-blur-md mb-8 transition-colors hover:bg-muted/60">
          <Sparkles
            className="h-3.5 w-3.5 text-indigo-400"
            aria-hidden="true"
          />
          <span className="text-muted-foreground">AI Engine 2.0</span>
          <Badge
            variant="secondary"
            className="ml-1 text-xs font-medium bg-indigo-500/20 text-indigo-400 border-none hover:bg-indigo-500/30"
          >
            Available Now
          </Badge>
        </div>

        {/* Main heading */}
        <h1
          id="hero-heading"
          className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl"
          style={{ textWrap: "balance" }}
        >
          <SplittingText text="Code reviews on" type="words" delay={100} />
          {" "}
          <Fade delay={600} className="inline-block">
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm ml-2 md:ml-4">
              autopilot
            </span>
          </Fade>
        </h1>

        {/* Description */}
        <Fade delay={800}>
          <p
            className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
            style={{ textWrap: "balance" }}
          >
            Connect your GitHub repositories and let our AI agent analyze,
            comment, and secure your pull requests in seconds before you merge.
          </p>
        </Fade>

        <Fade delay={1000}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {session ? (
              <Button
                size="lg"
                className="h-14 px-10 text-base w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98] transition-colors duration-200 rounded-full font-bold shadow-[0_0_40px_rgba(0,0,0,0.1)] group"
                asChild
              >
                <Link
                  href="/repo"
                  title="Go to your repositories dashboard"
                  aria-label="Go to Repositories"
                >
                  <Github className="h-5 w-5 mr-2" aria-hidden="true" />
                  Go to Repositories
                  <ArrowRight
                    className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="h-14 px-8 text-base w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 rounded-full font-semibold shadow-[0_0_40px_rgba(0,0,0,0.1)] group"
                  asChild
                >
                  <Link
                    href="/sign-up"
                    title="Create a free account and start reviewing code"
                    aria-label="Start Reviewing Free"
                  >
                    Start Reviewing Free
                    <ArrowRight
                      className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base w-full sm:w-auto rounded-full border-border bg-card/50 backdrop-blur-md hover:bg-muted transition-colors duration-200 text-muted-foreground"
                  asChild
                >
                  <Link
                    href="/sign-in"
                    title="Sign in to your Code Catch account"
                    aria-label="Sign In"
                  >
                    <Command
                      className="h-4 w-4 mr-2 text-muted-foreground/60"
                      aria-hidden="true"
                    />
                    Sign In
                  </Link>
                </Button>
              </>
            )}
          </div>
        </Fade>

        {/* Trust indicators */}
        <Fade delay={1200}>
          <div className="mt-10 mb-20 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-indigo-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              1-click GitHub setup
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-pink-500" />
              SOC2 Compliant
            </span>
          </div>
        </Fade>
      </div>

      {/* Hero Graphic / Code Mockup */}
      <Fade
        delay={1400}
        className="relative mx-auto max-w-5xl px-4 sm:px-6 pb-24"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-20 pointer-events-none h-full w-full" />

        {/* Glow behind the editor */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-indigo-500/20 blur-[120px] rounded-full z-0 pointer-events-none" />

        <div className="relative z-10 rounded-xl border border-border bg-card/80 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-black/20 ring-1 ring-border">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 mr-4">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground font-mono">
                <GitMerge className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span>Feature/auth-refactor</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wider bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              >
                <Check className="h-3 w-3 mr-1" /> All Checks Passed
              </Badge>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Code Editor Left */}
            <div className="w-full md:w-3/5 border-b md:border-b-0 md:border-r border-border p-6 font-mono text-[13px] leading-relaxed overflow-x-auto text-foreground/80">
              <div className="flex gap-4">
                <div className="text-muted-foreground/40 select-none text-right flex flex-col gap-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                  <span>8</span>
                  <span>9</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div>
                    <span className="text-pink-500">export async function</span>{" "}
                    <span className="text-blue-500">validateSession</span>
                    (req: <span className="text-yellow-600 dark:text-yellow-300">Request</span>)
                    &#123;
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-pink-500">const</span>{" "}
                    token = req.headers.
                    <span className="text-blue-500">get</span>(
                    <span className="text-green-600 dark:text-green-400">
                      &quot;Authorization&quot;
                    </span>
                    );
                  </div>
                  <div className="bg-red-500/10 border-l-2 border-red-500 pl-2 -ml-[10px] py-0.5 text-muted-foreground/50 line-through">
                    &nbsp;&nbsp;<span className="text-pink-500">const</span>{" "}
                    user = <span className="text-pink-500">await</span>{" "}
                    db.query(
                    <span className="text-green-600 dark:text-green-400">
                      `SELECT * FROM users WHERE token =
                      &#39;&#36;&#123;token&#125;&#39;`
                    </span>
                    );
                  </div>
                  <div className="bg-emerald-500/10 border-l-2 border-emerald-500 pl-2 -ml-[10px] py-0.5">
                    &nbsp;&nbsp;<span className="text-pink-500">const</span>{" "}
                    user = <span className="text-pink-500">await</span> db.user.
                    <span className="text-blue-500">findUnique</span>(&#123;
                  </div>
                  <div className="bg-emerald-500/10 border-l-2 border-emerald-500 pl-2 -ml-[10px] py-0.5">
                    &nbsp;&nbsp;&nbsp;&nbsp;where: &#123; token &#125;
                  </div>
                  <div className="bg-emerald-500/10 border-l-2 border-emerald-500 pl-2 -ml-[10px] py-0.5">
                    &nbsp;&nbsp;&#125;);
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-pink-500">if</span>{" "}
                    (!user) <span className="text-pink-500">throw new</span>{" "}
                    <span className="text-yellow-600 dark:text-yellow-300">Error</span>(
                    <span className="text-green-600 dark:text-green-400">
                      &quot;Unauthorized&quot;
                    </span>
                    );
                  </div>
                  <div>
                    &nbsp;&nbsp;<span className="text-pink-500">return</span>{" "}
                    user;
                  </div>
                  <div>&#125;</div>
                </div>
              </div>
            </div>

            {/* AI Review Sidebar Right */}
            <div className="w-full md:w-2/5 bg-muted/20 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded bg-indigo-500/20 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  AI Review
                </span>
              </div>

              {/* Insight Card 1 */}
              <div className="bg-card border border-red-500/20 rounded-lg p-4 shadow-sm relative overflow-hidden hover:border-red-500/40 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-red-500">
                    <FileCode className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Critical Security Fix
                    </span>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                  I replaced the raw SQL query with Prisma&apos;s{" "}
                  <code className="bg-background/50 px-1 py-0.5 rounded text-indigo-500">
                    findUnique
                  </code>
                  . The previous code was vulnerable to SQL Injection attacks.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs"
                  >
                    Accept Suggestion
                  </Button>
                </div>
              </div>

              {/* Insight Card 2 */}
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm relative overflow-hidden hover:border-border/80 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-blue-500">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Performance
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Consider caching the session token in Redis to reduce database
                  load on subsequent API calls.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating status badge */}
        <div className="absolute -right-6 top-1/4 hidden lg:flex">
          <div className="bg-card/90 backdrop-blur-xl border border-border rounded-xl p-4 shadow-2xl flex items-center gap-4">
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <Check className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">
                Review Approved
              </div>
              <div className="text-xs text-muted-foreground">
                Ready to merge in 2.1s
              </div>
            </div>
          </div>
        </div>
      </Fade>
    </section>
  );
}
