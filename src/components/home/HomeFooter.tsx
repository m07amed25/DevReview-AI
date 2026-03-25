import Link from "next/link";
import { Code2 } from "lucide-react";

export function HomeFooter() {
  return (
    <footer
      className="border-t border-border/40 bg-muted/20"
      role="contentinfo"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
              <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <span className="font-semibold">CodeReviewAI</span>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex items-center gap-6 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/sign-in"
                  className="hover:text-foreground transition-colors duration-200 focus:outline-none focus:text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-sm"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-foreground transition-colors duration-200 focus:outline-none focus:text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-sm"
                >
                  Get started
                </Link>
              </li>
            </ul>
          </nav>

          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CodeReviewAI
          </span>
        </div>

        {/* Developer Credit */}
        <div className="mt-6 pt-6 border-t border-border/30 text-center">
          <p className="text-sm text-muted-foreground">
            Developed by{" "}
            <a
              href="mailto:m07hamedreda25@gmail.com"
              className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
            >
              Mohamed Reda
            </a>{" "}
            -{" "}
            <a
              href="mailto:m07hamedreda25@gmail.com"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              m07hamedreda25@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
