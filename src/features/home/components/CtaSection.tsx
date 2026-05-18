"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";

export function CtaSection() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [data] = trpc.home.getRecentUsers.useSuspenseQuery();

  const recentUsers = data.recentUsers;
  const totalUsers = data.totalUsers;

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="cta-section relative overflow-hidden bg-background border-t border-border"
      aria-labelledby="cta-heading"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_120%,rgba(120,119,198,0.3),transparent_100%)]" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-muted/30 border border-border text-sm text-indigo-300">
          <Sparkles className="h-4 w-4" />
          <span>Transform your workflow today</span>
        </div>

        <h2
          id="cta-heading"
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6"
          style={{ textWrap: "balance" }}
        >
          Ready to ship better code,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">
            faster?
          </span>
        </h2>

        <p
          className="mx-auto mt-4 max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10"
          style={{ textWrap: "balance" }}
        >
          Join thousands of engineering teams who have automated their code
          reviews. Start for free, upgrade when you need more power.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 min-h-[56px]">
          {mounted && session ? (
            <Button
              size="lg"
              className="h-14 px-10 text-base w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-full font-bold shadow-[0_0_30px_rgba(120,119,198,0.15)] group"
              asChild
            >
              <Link
                href="/repo"
                title="Explore your repositories"
                aria-label="Explore Repositories"
              >
                <Github
                  className="h-5 w-5 mr-2 transition-transform group-hover:scale-110"
                  aria-hidden="true"
                />
                Explore Repositories
                <ArrowRight
                  className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                className="h-14 px-8 text-base w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-full font-semibold shadow-[0_0_30px_rgba(120,119,198,0.15)]"
                asChild
              >
                <Link
                  href="/sign-up"
                  title="Create a free account and get started"
                  aria-label="Get Started for Free"
                >
                  Get Started for Free
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base w-full sm:w-auto rounded-full border-border bg-card/50 backdrop-blur-md hover:bg-muted hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-foreground/80"
                asChild
              >
                <Link
                  href="/pricing"
                  title="View pricing and plans"
                  aria-label="View Pricing"
                >
                  View Pricing
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Social proof */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground/70 font-medium">
          {recentUsers.length > 0 && (
            <div className="flex -space-x-3">
              {recentUsers.map((user, i) => (
                <div
                  key={user.id || i}
                  className="relative h-10 w-10 rounded-full border-2 border-background overflow-hidden bg-muted shadow-sm"
                  aria-hidden="true"
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User avatar"}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <span className="mt-2 sm:mt-0">Join {totalUsers}+ developers</span>
        </div>
      </div>
    </section>
  );
}
