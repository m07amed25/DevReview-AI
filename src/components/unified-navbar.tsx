"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Github,
  Menu,
  X,
  Star,
  CreditCard,
  ChevronDown,
  Zap,
  BookOpen,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserMenu } from "./user-menu";
import { Notifications } from "./notifications";
import {
  resourceLinks,
  simpleLinks,
  workspaceLinks,
} from "@/features/home/components/header/nav-data";

export function UnifiedNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const user = session?.user;

  return (
    <>
      <header
        className={cn(
          "fixed top-banner-offset w-full z-50 transition-all duration-300",
          isScrolled
            ? "border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-lg shadow-black/10"
            : "border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl",
        )}
        role="banner"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-80 transition-all duration-200 group"
            aria-label="Code Catch - Home"
          >
            <Logo className="h-8 transition-all duration-300 group-hover:scale-105" />
            <span className="text-base text-white font-bold tracking-tight">
              Code{" "}
              <span className="bg-linear-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Catch
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5" aria-label="Main navigation">
            {isClient && user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 outline-none text-zinc-400 hover:text-white hover:bg-white/5">
                  <LayoutDashboard className="h-4 w-4" />
                  Workspace
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-60 p-1.5 bg-zinc-900 border-zinc-800 text-zinc-100">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-2 py-1">
                    Workspace
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                  {workspaceLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href} className="flex items-start gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-white/5">
                          <div className="flex items-center justify-center size-7 rounded-md bg-indigo-500/15 mt-0.5 shrink-0">
                            <Icon className="size-3.5 text-indigo-400" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-zinc-100">{link.label}</span>
                            <span className="text-[11px] text-zinc-500">{link.description}</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Link href="/product" className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200", pathname?.startsWith("/product") ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5")}>
              <Zap className="h-4 w-4" />
              Product
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 outline-none", ["/docs", "/blog", "/changelog", "/status", "/contact"].some((p) => pathname?.startsWith(p)) ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5")}>
                <BookOpen className="h-4 w-4" />
                Resources
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-60 p-1.5 bg-zinc-900 border-zinc-800 text-zinc-100">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-2 py-1">
                  Resources
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                {resourceLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link href={link.href} className="flex items-start gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-white/5">
                        <div className="flex items-center justify-center size-7 rounded-md bg-zinc-800 mt-0.5 shrink-0">
                          <Icon className="size-3.5 text-zinc-400" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-zinc-100">{link.label}</span>
                          <span className="text-[11px] text-zinc-500">{link.description}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/pricing" className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200", pathname === "/pricing" ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5")}>
              <CreditCard className="h-4 w-4" />
              Pricing
            </Link>

            {simpleLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200", pathname === link.href ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5")}>
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {isClient && user && (user as { role?: string }).role === "ADMIN" && (
              <Link href="/admin" className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200", pathname?.startsWith("/admin") ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5")}>
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}

            <a href="https://github.com/m07amed25/DevReview-AI" target="_blank" rel="noopener noreferrer" className="ml-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200 group">
              <Github className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              <span className="hidden lg:inline">Star</span>
              <Star className="h-3 w-3 fill-zinc-400 group-hover:fill-yellow-400 transition-colors" />
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isClient && user ? (
              <>
                <Notifications />
                <UserMenu
                  user={{
                    id: user.id,
                    name: user.name ?? "User",
                    email: user.email,
                    image: user.image,
                    role: (user as { role?: string }).role,
                  }}
                />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="hidden md:inline-flex bg-linear-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 rounded-full font-semibold shadow-lg shadow-indigo-500/20 px-5 group">
                  <Link href="/sign-up">
                    Get Started
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile menu trigger */}
            <button
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-200"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Panel */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 top-0 z-[70] bg-zinc-950 border-b border-white/10 flex flex-col md:hidden max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <span className="text-sm font-semibold text-white">Navigation</span>
                <button onClick={() => setMobileOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto relative">
              <nav className="px-4 py-4 pb-8 space-y-5">
                {/* Workspace */}
                {isClient && user && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold px-3 mb-2">Workspace</p>
                    <div className="space-y-0.5">
                      {workspaceLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                              isActive
                                ? "bg-indigo-500/15 text-indigo-400 font-medium"
                                : "text-zinc-300 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <Icon className={cn("size-[18px] shrink-0", isActive ? "text-indigo-400" : "text-zinc-500")} />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Product */}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold px-3 mb-2">Product</p>
                  <div className="space-y-0.5">
                    <Link
                      href="/product"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                        pathname?.startsWith("/product")
                          ? "bg-indigo-500/15 text-indigo-400 font-medium"
                          : "text-zinc-300 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Zap className={cn("size-[18px] shrink-0", pathname?.startsWith("/product") ? "text-indigo-400" : "text-zinc-500")} />
                      Code Review
                    </Link>
                    <Link
                      href="/product#security"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-150"
                    >
                      <Shield className="size-[18px] shrink-0 text-zinc-500" />
                      Security
                    </Link>
                    <Link
                      href="/product#diagrams"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-150"
                    >
                      <Github className="size-[18px] shrink-0 text-zinc-500" />
                      Diagrams
                    </Link>
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold px-3 mb-2">Resources</p>
                  <div className="space-y-0.5">
                    {resourceLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = pathname?.startsWith(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                            isActive
                              ? "bg-indigo-500/15 text-indigo-400 font-medium"
                              : "text-zinc-300 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <Icon className={cn("size-[18px] shrink-0", isActive ? "text-indigo-400" : "text-zinc-500")} />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Pricing & Other */}
                <div className="space-y-0.5">
                  <Link
                    href="/pricing"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                      pathname === "/pricing"
                        ? "bg-indigo-500/15 text-indigo-400 font-medium"
                        : "text-zinc-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <CreditCard className={cn("size-[18px] shrink-0", pathname === "/pricing" ? "text-indigo-400" : "text-zinc-500")} />
                    Pricing
                  </Link>
                  {simpleLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                          isActive
                            ? "bg-indigo-500/15 text-indigo-400 font-medium"
                            : "text-zinc-300 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Icon className={cn("size-[18px] shrink-0", isActive ? "text-indigo-400" : "text-zinc-500")} />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </nav>
              {/* Scroll hint */}
              <div className="sticky bottom-0 flex justify-center py-2 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent">
                <ChevronDown className="h-4 w-4 text-zinc-500 animate-bounce" />
              </div>
              </div>

              {/* Bottom */}
              <div className="px-4 py-4 border-t border-white/10">
                {isClient && user ? (
                  <Link href="/repo" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors">
                    <Github className="h-4 w-4" />
                    Repositories
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="block text-center w-full py-2.5 rounded-lg text-sm text-zinc-300 hover:text-white border border-white/10 hover:bg-white/5">
                      Sign In
                    </Link>
                    <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-1 w-full py-2.5 rounded-full bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors">
                      Get Started
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
