import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40"
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
  );
}
