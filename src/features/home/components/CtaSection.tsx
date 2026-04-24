import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section
      className="cta-section relative overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-accent/8"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,var(--primary)/5,transparent_50%)]"
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
          Join thousands of developers who ship better code, faster. Start free,
          upgrade when your team needs more.
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
  );
}
