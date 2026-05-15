"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  FolderGit2,
  GitPullRequest,
  Users,
  BarChart3,
  Shield,
  ChevronDown,
  GitMerge,
  Activity,
  LayoutDashboard,
  Menu,
  X,
  BookOpen,
  FileText,
  MessageSquare,
  Radio,
  CreditCard,
  Zap,
  GitBranch,
} from "lucide-react";
import { UserMenu } from "./user-menu";
import { Notifications } from "./notifications";
import { Logo } from "./ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  role?: string;
}

interface HeaderProps {
  user: User;
}


const resourceLinks = [
  { href: "/docs", label: "Documentation", icon: BookOpen, description: "Guides and API reference" },
  { href: "/blog", label: "Blog", icon: FileText, description: "Updates and articles" },
  { href: "/changelog", label: "Changelog", icon: Activity, description: "What's new" },
  { href: "/status", label: "Status", icon: Radio, description: "Service health" },
  { href: "/contact", label: "Contact", icon: MessageSquare, description: "Get in touch" },
];

const workspaceLinks = [
  { href: "/repo", label: "Repositories", icon: FolderGit2, description: "Browse all repositories" },
  { href: "/reviews", label: "Reviews", icon: GitPullRequest, description: "Your code reviews" },
  { href: "/reviews?status=pending", label: "Pending Reviews", icon: GitMerge, description: "Awaiting your attention" },
  { href: "/teams", label: "Teams", icon: Users, description: "Your teams" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, description: "Insights and reporting" },
];

const mobileAllItems = [
  { section: "Workspace", items: [
    { href: "/repo", label: "Repositories", icon: FolderGit2 },
    { href: "/reviews", label: "Reviews", icon: GitPullRequest },
    { href: "/reviews?status=pending", label: "Pending Reviews", icon: GitMerge },
    { href: "/teams", label: "Teams", icon: Users },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ]},
  { section: "Product", items: [
    { href: "/product#review", label: "Code Review", icon: GitPullRequest },
    { href: "/product#security", label: "Security", icon: Shield },
    { href: "/product#diagrams", label: "Diagrams", icon: GitBranch },
  ]},
  { section: "Resources", items: [
    { href: "/docs", label: "Documentation", icon: BookOpen },
    { href: "/blog", label: "Blog", icon: FileText },
    { href: "/changelog", label: "Changelog", icon: Activity },
    { href: "/contact", label: "Contact", icon: MessageSquare },
  ]},
];

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isWorkspaceActive = ["/repo", "/reviews", "/teams", "/analytics"].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isProductActive = pathname === "/product" || pathname.startsWith("/product");
  const isResourcesActive = ["/docs", "/blog", "/changelog", "/status", "/contact"].some((p) =>
    pathname.startsWith(p),
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-80 transition-opacity group shrink-0"
            aria-label="Code Catch - Home"
          >
            <Logo className="h-7 transition-all duration-200 group-hover:scale-105" />
            <span className="text-sm font-bold">
              Code{" "}
              <span className="bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Catch
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">

            {/* Workspace Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 outline-none",
                  isWorkspaceActive
                    ? "text-primary bg-primary/8 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <LayoutDashboard className="size-4" />
                Workspace
                <ChevronDown className="size-3 ml-0.5 transition-transform duration-200 data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-60 p-1.5">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-2 py-1">
                  Workspace
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                {workspaceLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || pathname.startsWith(`${link.href.split("?")[0]}/`);
                  return (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-start gap-3 px-2 py-2 rounded-md cursor-pointer",
                          isActive && "bg-primary/5 text-primary",
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center size-7 rounded-md mt-0.5 shrink-0",
                          isActive ? "bg-primary/15" : "bg-muted",
                        )}>
                          <Icon className={cn("size-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{link.label}</span>
                          <span className="text-[11px] text-muted-foreground">{link.description}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Product */}
            <Link
              href="/product"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105",
                isProductActive
                  ? "text-primary bg-primary/8 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Zap className="size-4" />
              Product
            </Link>

            {/* Resources Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 outline-none",
                  isResourcesActive
                    ? "text-primary bg-primary/8 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <BookOpen className="size-4" />
                Resources
                <ChevronDown className="size-3 ml-0.5 transition-transform duration-200 data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-60 p-1.5">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-2 py-1">
                  Resources
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                {resourceLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-start gap-3 px-2 py-2 rounded-md cursor-pointer",
                          isActive && "bg-primary/5 text-primary",
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center size-7 rounded-md mt-0.5 shrink-0",
                          isActive ? "bg-primary/15" : "bg-muted",
                        )}>
                          <Icon className={cn("size-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{link.label}</span>
                          <span className="text-[11px] text-muted-foreground">{link.description}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Pricing */}
            <Link
              href="/pricing"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105",
                pathname === "/pricing"
                  ? "text-primary bg-primary/8 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <CreditCard className="size-4" />
              Pricing
            </Link>

            {/* Admin */}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105",
                  pathname.startsWith("/admin")
                    ? "text-primary bg-primary/8 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Shield className="size-4" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Notifications />
          <UserMenu user={user} />

          {/* Mobile Menu Trigger */}
          <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogTrigger asChild>
              <button
                className="md:hidden flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                aria-label="Open navigation menu"
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm p-0 border-border/60">
              <DialogHeader className="px-4 pt-4 pb-0">
                <DialogTitle className="text-sm font-semibold text-muted-foreground">Navigation</DialogTitle>
              </DialogHeader>
              <nav className="flex flex-col p-3 pt-2 max-h-[70vh] overflow-y-auto">
                {mobileAllItems.map((group) => (
                  <div key={group.section}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-2 py-1 mt-2">
                      {group.section}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href.split("?")[0]}/`);
                      return (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                            isActive
                              ? "text-primary bg-primary/8 shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                ))}

                <div className="h-px bg-border my-2" />
                <Link
                  href="/pricing"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                    pathname === "/pricing"
                      ? "text-primary bg-primary/8"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <CreditCard className="size-4 shrink-0" />
                  Pricing
                </Link>

                {user.role === "ADMIN" && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                        pathname.startsWith("/admin")
                          ? "text-primary bg-primary/8"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      <Shield className="size-4 shrink-0" />
                      Admin Panel
                    </Link>
                  </>
                )}
              </nav>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

