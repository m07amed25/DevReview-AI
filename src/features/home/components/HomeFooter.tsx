import Link from "next/link";
import {
  Github,
  Twitter,
  Linkedin,
  Mail,
  Shield,
  Zap,
  Users,
  Star,
  Instagram,
} from "lucide-react";
import { db } from "@/server/db";
import { Logo } from "@/components/ui/logo";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Languages", href: "#languages" },
    { label: "Pricing", href: "/pricing", soon: true },
    { label: "Changelog", href: "/changelog", soon: true },
  ],
  resources: [
    { label: "Documentation", href: "#docs" },
    { label: "API Reference", href: "/docs/api", soon: true },
    { label: "Status", href: "/status", soon: true },
    { label: "Blog", href: "/blog", soon: true },
  ],
  company: [
    { label: "About", href: "/about", soon: true },
    { label: "Privacy Policy", href: "/privacy", soon: true },
    { label: "Terms of Service", href: "/terms", soon: true },
    { label: "Security", href: "/security", soon: true },
    { label: "Contact", href: "/contact", soon: true },
  ],
};

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/code.catch/",
    icon: Instagram,
  },
  {
    label: "X",
    href: "https://x.com/codecatchdev",
    icon: Twitter,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/code-catch",
    icon: Linkedin,
  },
  {
    label: "Email",
    href: "mailto:codecatch27@gmail.com",
    icon: Mail,
  },
];

function formatCount(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k+`;
  return n.toString();
}

export async function HomeFooter() {
  const [totalUsers, totalTeams, totalReviews, totalRepos] = await Promise.all([
    db.user.count(),
    db.team.count(),
    db.review.count(),
    db.repository.count(),
  ]);

  const stats = [
    { icon: Users, value: formatCount(totalUsers), label: "Developers" },
    { icon: Star, value: formatCount(totalTeams), label: "Active Teams" },
    { icon: Zap, value: formatCount(totalReviews), label: "Reviews Done" },
    { icon: Shield, value: formatCount(totalRepos), label: "Repos Connected" },
  ];

  return (
    <footer className="relative bg-zinc-950 overflow-hidden" role="contentinfo">
      {/* Top gradient border */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-indigo-500/40 to-transparent" />

      {/* Background glows */}
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Stats bar */}
      <div className="border-b border-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 group">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/15 transition-colors duration-200">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{value}</p>
                  <p className="text-xs text-zinc-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <Logo className="h-9 transition-all duration-200 group-hover:scale-105" />
              <span className="font-bold text-lg text-white tracking-tight">
                Code{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-blue-400">
                  Catch
                </span>
              </span>
            </Link>

            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
              Automated AI-powered code reviews for engineering teams. Catch
              bugs, security vulnerabilities, and quality issues instantly in
              every pull request.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ))}
            </div>

            {/* GitHub star CTA */}
            <a
              href="https://github.com/m07amed25/DevReview-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/8 hover:border-white/20 transition-all duration-200 group w-fit"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              <span>Star on GitHub</span>
              <Star
                className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400/50 group-hover:fill-yellow-400 transition-colors"
                aria-hidden="true"
              />
            </a>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:col-span-3">
            {/* Product */}
            <nav aria-label="Product links">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
                Product
              </p>
              <ul className="space-y-2.5">
                {footerLinks.product.map(({ label, href, soon }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 inline-flex items-center gap-2"
                    >
                      {label}
                      {soon && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 leading-none">
                          soon
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Resources */}
            <nav aria-label="Resources links">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
                Resources
              </p>
              <ul className="space-y-2.5">
                {footerLinks.resources.map(({ label, href, soon }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 inline-flex items-center gap-2"
                    >
                      {label}
                      {soon && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 leading-none">
                          soon
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Company */}
            <nav aria-label="Company links">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
                Company
              </p>
              <ul className="space-y-2.5">
                {footerLinks.company.map(({ label, href, soon }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 inline-flex items-center gap-2"
                    >
                      {label}
                      {soon && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 leading-none">
                          soon
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-zinc-600">
              © {new Date().getFullYear()} Code Catch. All rights reserved.
              Built with <span className="text-indigo-500/70">♥</span> for
              developers.
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <Link
                href="/privacy"
                className="hover:text-zinc-400 transition-colors"
              >
                Privacy
              </Link>
              <span className="text-zinc-800">·</span>
              <Link
                href="/terms"
                className="hover:text-zinc-400 transition-colors"
              >
                Terms
              </Link>
              <span className="text-zinc-800">·</span>
              <Link
                href="/security"
                className="hover:text-zinc-400 transition-colors"
              >
                Security
              </Link>
              <span className="text-zinc-800">·</span>
              <Link
                href="/sitemap.xml"
                className="hover:text-zinc-400 transition-colors"
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
