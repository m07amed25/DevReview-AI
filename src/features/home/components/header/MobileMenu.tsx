"use client";

import Link from "next/link";
import {
  ArrowRight,
  Github,
  X,
  Star,
  CreditCard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  session: { user?: { name?: string | null; email?: string | null; image?: string | null } } | null;
  pathname: string;
  userInitials: string;
  isSigningOut: boolean;
  onSignOut: () => void;
  productLinks: { href: string; label: string; icon: React.ElementType; description: string }[];
  resourceLinks: { href: string; label: string; icon: React.ElementType; description: string }[];
  workspaceLinks: { href: string; label: string; icon: React.ElementType; description: string }[];
  simpleLinks: { href: string; label: string; icon: React.ElementType }[];
}

export function MobileMenu({
  open,
  onClose,
  session,
  pathname,
  userInitials,
  isSigningOut,
  onSignOut,
  productLinks,
  resourceLinks,
  workspaceLinks,
  simpleLinks,
}: MobileMenuProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col md:hidden overflow-hidden",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none",
      )}
      aria-label="Mobile navigation"
    >
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.12),transparent)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="relative flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 h-16 shrink-0">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <Logo className="h-8" />
            <span className="text-lg text-white font-bold tracking-tight">
              Code{" "}
              <span className="bg-linear-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Catch</span>
            </span>
          </Link>
          <button
            className="flex items-center justify-center h-9 w-9 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <nav className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-8">
          {/* Workspace */}
          {session && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400/80 mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-px bg-indigo-500/60" />
                Workspace
              </p>
              <div className="space-y-1">
                {workspaceLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href.split("?")[0]);
                  return (
                    <Link key={link.href} href={link.href} onClick={onClose} className={cn("flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group", isActive ? "bg-indigo-500/10 border border-indigo-500/20" : "hover:bg-white/4")}>
                      <div className={cn("flex items-center justify-center h-9 w-9 rounded-xl shrink-0 transition-all", isActive ? "bg-indigo-500/20 text-indigo-300" : "bg-zinc-800/80 text-zinc-400 group-hover:bg-zinc-700/80 group-hover:text-zinc-200")}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className={cn("text-sm font-semibold", isActive ? "text-white" : "text-zinc-300 group-hover:text-white")}>{link.label}</span>
                        <span className="text-[11px] text-zinc-600">{link.description}</span>
                      </div>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-3 flex items-center gap-2">
              <span className="inline-block w-3 h-px bg-zinc-600" />
              Product
            </p>
            <div className="space-y-1">
              {productLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href.split("#")[0]);
                return (
                  <Link key={link.href + link.label} href={link.href} onClick={onClose} className={cn("flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group", isActive ? "bg-white/5" : "hover:bg-white/4")}>
                    <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-zinc-800/80 text-zinc-400 group-hover:bg-zinc-700/80 group-hover:text-zinc-200 shrink-0 transition-all">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-300 group-hover:text-white">{link.label}</span>
                      <span className="text-[11px] text-zinc-600">{link.description}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-3 flex items-center gap-2">
              <span className="inline-block w-3 h-px bg-zinc-600" />
              Resources
            </p>
            <div className="space-y-1">
              {resourceLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link key={link.href} href={link.href} onClick={onClose} className={cn("flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group", isActive ? "bg-white/5" : "hover:bg-white/4")}>
                    <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-zinc-800/80 text-zinc-400 group-hover:bg-zinc-700/80 group-hover:text-zinc-200 shrink-0 transition-all">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-300 group-hover:text-white">{link.label}</span>
                      <span className="text-[11px] text-zinc-600">{link.description}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Extra links */}
          <div className="flex flex-wrap gap-2">
            {simpleLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href + link.label} href={link.href} onClick={onClose} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-zinc-500 hover:text-zinc-200 bg-white/4 hover:bg-white/8 border border-zinc-800/70 transition-all">
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
            <Link href="/pricing" onClick={onClose} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-zinc-500 hover:text-zinc-200 bg-white/4 hover:bg-white/8 border border-zinc-800/70 transition-all">
              <CreditCard className="h-3.5 w-3.5" />
              Pricing
            </Link>
            <a href="https://github.com/m07amed25/DevReview-AI" target="_blank" rel="noopener noreferrer" onClick={onClose} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-zinc-500 hover:text-zinc-200 bg-white/4 hover:bg-white/8 border border-zinc-800/70 transition-all">
              <Github className="h-3.5 w-3.5" />
              GitHub
              <Star className="h-3 w-3 fill-zinc-500" />
            </a>
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-5 pb-8 pt-4 border-t border-zinc-800/60">
          {session ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-indigo-500/30">
                <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? "User"} />
                <AvatarFallback className="text-sm font-bold bg-indigo-500/20 text-indigo-300">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-white truncate">{session.user?.name ?? "User"}</span>
                <span className="text-xs text-zinc-500 truncate">{session.user?.email}</span>
              </div>
              <button onClick={onSignOut} disabled={isSigningOut} title="Sign out" className="flex items-center justify-center h-9 w-9 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40 shrink-0">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/sign-up" onClick={onClose} className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-2xl text-sm font-bold bg-linear-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98]">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sign-in" onClick={onClose} className="flex items-center justify-center w-full px-4 py-3 rounded-2xl text-sm font-medium text-zinc-400 hover:text-white bg-white/4 hover:bg-white/8 border border-zinc-800/70 transition-all duration-200">
                Already have an account? Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
