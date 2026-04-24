import Link from "next/link";
import { ArrowRight, CheckCircle, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeroSectionProps {
  badgeRef: React.RefObject<HTMLDivElement | null>;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  descRef: React.RefObject<HTMLParagraphElement | null>;
  ctaRef: React.RefObject<HTMLDivElement | null>;
  trustRef: React.RefObject<HTMLDivElement | null>;
  codeRef: React.RefObject<HTMLDivElement | null>;
}

export function HeroSection({
  badgeRef,
  headingRef,
  descRef,
  ctaRef,
  trustRef,
  codeRef,
}: HeroSectionProps) {
  return (
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
          <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
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
          <span className="bg-linear-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            faster
          </span>
        </h1>

        {/* Description */}
        <p
          ref={descRef}
          className="mx-auto mt-6 max-w-2.5xl text-lg text-muted-foreground leading-relaxed"
        >
          Automated code reviews that catch bugs, security issues, and
          maintainability problems before they reach production. Save hours on
          every pull request.
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
                <span className="text-blue-400">reviewCode</span>({"("}&#123;
              </div>
              <div className="pl-4 text-muted-foreground">pullRequest: pr,</div>
              <div className="pl-4 text-muted-foreground">
                includeSecurity: <span className="text-blue-400">true</span>,
              </div>
              <div className="pl-4 text-muted-foreground">
                includePerformance: <span className="text-blue-400">true</span>
              </div>
              <div className="text-muted-foreground">&#125;);</div>
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
                    <span className="text-purple-400 font-medium">Style:</span>{" "}
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
  );
}
