import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeHeader() {
  return (
    <header
      className="fixed top-0 w-full z-50 border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl supports-backdrop-filter:bg-zinc-950/20"
      role="banner"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight hover:opacity-80 transition-all duration-200 group"
          aria-label="CodeReviewAI - Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/40">
            <Code2 className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg text-white">DevReview AI</span>
        </Link>

        <nav
          className="flex items-center gap-2"
          role="navigation"
          aria-label="Main navigation"
        >
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex text-zinc-300 hover:text-white hover:bg-white/5"
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-white text-zinc-900 hover:bg-zinc-200 rounded-full font-semibold shadow-lg shadow-white/10 px-5"
          >
            <Link href="/sign-up">
              Get Started
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
