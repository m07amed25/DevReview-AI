"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Github,
  Menu,
  X,
  Sparkles,
  Zap,
  BookOpen,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const navigationLinks = [
  { href: "#features", label: "Features", icon: Sparkles },
  { href: "#how-it-works", label: "How It Works", icon: Zap },
  { href: "#languages", label: "Languages", icon: Code2 },
  { href: "#docs", label: "Docs", icon: BookOpen },
];

export function HomeHeader() {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);

      // Calculate scroll progress
      const winScroll = window.scrollY;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);

      // Detect active section
      const sections = navigationLinks.map((link) =>
        link.href.replace("#", ""),
      );
      const currentSection = sections.find((section) => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (currentSection) {
        setActiveSection(`#${currentSection}`);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.getElementById(href.replace("#", ""));
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-900 z-[100]">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300",
          isScrolled
            ? "border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-lg shadow-black/10"
            : "border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl",
        )}
        role="banner"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight hover:opacity-80 transition-all duration-200 group relative z-10"
            aria-label="DevReview AI - Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/40 group-hover:rotate-3">
              <Code2 className="h-5 w-5" />
            </div>
            <span className="text-lg text-white font-bold">DevReview AI</span>
            <span className="absolute -top-1 -right-8 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-500/20">
              BETA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center gap-1 lg:gap-2"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeSection === link.href;
              return (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105",
                    isActive
                      ? "text-white bg-white/10 shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </button>
              );
            })}

            {/* GitHub Star Button */}
            <a
              href="https://github.com/m07amed25/DevReview-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200 hover:scale-105 group"
            >
              <Github className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              <span className="hidden lg:inline">Star</span>
              <Star className="h-3 w-3 fill-zinc-400 group-hover:fill-yellow-400 transition-colors" />
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {session ? (
              <Button
                size="sm"
                asChild
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 rounded-full font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 px-5 group transition-all duration-200"
              >
                <Link
                  href="/repo"
                  title="View your repositories"
                  aria-label="Repositories"
                >
                  <Github
                    className="h-3.5 w-3.5 mr-1.5 transition-transform group-hover:scale-110"
                    aria-hidden="true"
                  />
                  Repositories
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden sm:inline-flex text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                >
                  <Link
                    href="/sign-in"
                    title="Sign in to your account"
                    aria-label="Sign In"
                  >
                    Sign In
                  </Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 rounded-full font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 px-5 group transition-all duration-200"
                >
                  <Link
                    href="/sign-up"
                    title="Create a new account"
                    aria-label="Get Started"
                  >
                    Get Started
                    <ArrowRight
                      className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-1 transition-transform"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden text-zinc-300 hover:text-white hover:bg-white/5 p-2"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Navigation</DialogTitle>
                </DialogHeader>
                <nav className="flex flex-col gap-2 mt-4">
                  {navigationLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = activeSection === link.href;
                    return (
                      <button
                        key={link.href}
                        onClick={() => scrollToSection(link.href)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left",
                          isActive
                            ? "text-white bg-indigo-500/20 border border-indigo-500/30"
                            : "text-zinc-400 hover:text-white hover:bg-white/5",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </button>
                    );
                  })}
                  <div className="border-t border-zinc-800 my-2" />
                  <a
                    href="https://github.com/m07amed25/DevReview-AI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    <Github className="h-5 w-5" />
                    View on GitHub
                  </a>
                  {!session && (
                    <>
                      <Link
                        href="/sign-in"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/sign-up"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </>
                  )}
                </nav>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
    </>
  );
}
