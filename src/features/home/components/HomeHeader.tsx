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
  Info,
  FileText,
  CreditCard,
  ChevronDown,
  GitPullRequest,
  Users,
  BarChart3,
  BookOpen,
  MessageSquare,
  Zap,
  Shield,
  GitBranch,
  Activity,
  Radio,
  FolderGit2,
  GitMerge,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const productLinks = [
  { href: "/product#review", label: "Code Review", icon: GitPullRequest, description: "AI-powered PR analysis" },
  { href: "/product#teams", label: "Teams", icon: Users, description: "Collaborate with your team" },
  { href: "/product#analytics", label: "Analytics", icon: BarChart3, description: "Insights and reporting" },
  { href: "/product#security", label: "Security", icon: Shield, description: "Vulnerability detection" },
  { href: "/product#diagrams", label: "Diagrams", icon: GitBranch, description: "Auto-generated architecture" },
];

const resourceLinks = [
  { href: "/docs", label: "Documentation", icon: BookOpen, description: "Guides and API reference" },
  { href: "/blog", label: "Blog", icon: FileText, description: "Updates and articles" },
  { href: "/changelog", label: "Changelog", icon: Activity, description: "What's new" },
  { href: "/status", label: "Status", icon: Radio, description: "Service health" },
  { href: "/contact", label: "Contact", icon: MessageSquare, description: "Get in touch" },
];

const simpleLinks = [
  { href: "/about", label: "About", icon: Info },
];

const workspaceLinks = [
  { href: "/repo", label: "Repositories", icon: FolderGit2, description: "Browse all repositories" },
  { href: "/reviews", label: "Reviews", icon: GitPullRequest, description: "Your code reviews" },
  { href: "/reviews?status=pending", label: "Pending Reviews", icon: GitMerge, description: "Awaiting your attention" },
  { href: "/teams", label: "Teams", icon: Users, description: "Your teams" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, description: "Insights and reporting" },
];

export function HomeHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight hover:opacity-80 transition-all duration-200 group relative z-10"
            aria-label="Code Catch - Home"
          >
            <Logo className="h-9 transition-all duration-300 group-hover:scale-105" />
            <span className="text-lg text-white font-bold tracking-tight">
              Code{" "}
              <span className="bg-linear-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Catch
              </span>
            </span>
            <span className="absolute -top-1 -right-8 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-500/20">
              BETA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center gap-1 lg:gap-1.5"
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Workspace Dropdown — only when logged in */}
            {isClient && session && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 outline-none text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Workspace
                  <ChevronDown className="h-3 w-3 transition-transform duration-200 data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  sideOffset={8}
                  className="w-60 p-1.5 bg-zinc-900 border-zinc-800 text-zinc-100"
                >
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-2 py-1">
                    Workspace
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                  {workspaceLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link
                          href={link.href}
                          className="flex items-start gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-white/5 focus:bg-white/5"
                        >
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

            {/* Product Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 outline-none",
                  (pathname === "/product" || pathname.startsWith("/product"))
                    ? "text-white bg-white/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Zap className="h-4 w-4" />
                Product
                <ChevronDown className="h-3 w-3 transition-transform duration-200 data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-64 p-1.5 bg-zinc-900 border-zinc-800 text-zinc-100"
              >
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-2 py-1">
                  Features
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                {productLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <DropdownMenuItem key={link.href + link.label} asChild>
                      <Link
                        href={link.href}
                        className="flex items-start gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-white/5 focus:bg-white/5"
                      >
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

            {/* Resources Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 outline-none",
                  ["/docs", "/blog", "/changelog", "/status", "/contact"].some((p) => pathname.startsWith(p))
                    ? "text-white bg-white/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/5",
                )}
              >
                <BookOpen className="h-4 w-4" />
                Resources
                <ChevronDown className="h-3 w-3 transition-transform duration-200 data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-60 p-1.5 bg-zinc-900 border-zinc-800 text-zinc-100"
              >
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-2 py-1">
                  Resources
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                {resourceLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-start gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-white/5 focus:bg-white/5",
                          isActive && "bg-white/5",
                        )}
                      >
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

            {/* Pricing — always visible */}
            <Link
              href="/pricing"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105",
                pathname === "/pricing"
                  ? "text-white bg-white/10 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              )}
            >
              <CreditCard className="h-4 w-4" />
              Pricing
            </Link>

            {/* Simple links */}
            {simpleLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105",
                    isActive
                      ? "text-white bg-white/10 shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* GitHub Star Button */}
            <a
              href="https://github.com/m07amed25/DevReview-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200 hover:scale-105 group"
            >
              <Github className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              <span className="hidden lg:inline">Star</span>
              <Star className="h-3 w-3 fill-zinc-400 group-hover:fill-yellow-400 transition-colors" />
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isClient && session ? (
              <Button
                size="sm"
                asChild
                className="bg-linear-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 rounded-full font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 px-5 group transition-all duration-200"
              >
                <Link href="/repo" title="View your repositories" aria-label="Repositories">
                  <Github className="h-3.5 w-3.5 mr-1.5 transition-transform group-hover:scale-110" aria-hidden="true" />
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
                  <Link href="/sign-in" title="Sign in to your account" aria-label="Sign In">
                    Sign In
                  </Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-linear-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 rounded-full font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 px-5 group transition-all duration-200"
                >
                  <Link href="/sign-up" title="Create a new account" aria-label="Get Started">
                    Get Started
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
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
              <DialogContent className="sm:max-w-106 bg-zinc-900 border-zinc-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Navigation</DialogTitle>
                </DialogHeader>
                <nav className="flex flex-col gap-1.5 mt-2">
                  {/* Workspace — only when logged in */}
                  {session && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold px-2 py-1 mt-1">Workspace</p>
                      {workspaceLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {link.label}
                          </Link>
                        );
                      })}
                      <div className="border-t border-zinc-800 my-1" />
                    </>
                  )}

                  {/* Product section */}
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold px-2 py-1 mt-1">Product</p>
                  {productLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href + link.label}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {link.label}
                      </Link>
                    );
                  })}

                  <div className="border-t border-zinc-800 my-1" />
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold px-2 py-1">Resources</p>
                  {resourceLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {link.label}
                      </Link>
                    );
                  })}

                  <div className="border-t border-zinc-800 my-1" />
                  {simpleLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href + link.label}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {link.label}
                      </Link>
                    );
                  })}

                  <div className="border-t border-zinc-800 my-1" />
                  <a
                    href="https://github.com/m07amed25/DevReview-AI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    <Github className="h-4 w-4" />
                    View on GitHub
                  </a>

                  {!session && (
                    <>
                      <Link
                        href="/sign-in"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/sign-up"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-linear-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 transition-all duration-200"
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
