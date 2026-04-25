import Link from "next/link";
import { Code2 } from "lucide-react";

export function HomeFooter() {
  return (
    <footer className="border-t border-white/5 bg-zinc-950" role="contentinfo">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-white/10 text-zinc-300">
              <Code2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-semibold text-zinc-200">Code Review</span>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex items-center gap-6 text-sm text-zinc-400">
              <li>
                <Link
                  href="/sign-in"
                  className="hover:text-white transition-colors duration-200"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-white transition-colors duration-200"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-white transition-colors duration-200"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </nav>

          <span className="text-sm text-zinc-600">
            © {new Date().getFullYear()} All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
