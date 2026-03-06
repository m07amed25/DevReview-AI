"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "./ui/dropdown-menu";
import {
  LogOut,
  User,
  Settings,
  ChevronDown,
  CreditCard,
  Keyboard,
  FolderGit2,
  GitPullRequest,
  LifeBuoy,
  MessageSquare,
  Sun,
  Moon,
  Monitor,
  ExternalLink,
  Shield,
  Bell,
  Loader2,
  Check,
  Users,
} from "lucide-react";

interface UserProps {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
}

export function UserMenu({ user }: { user: UserProps }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleThemeChange = useCallback(
    (newTheme: string, event?: React.MouseEvent) => {
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? 0;

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const doc = document as Document & {
        startViewTransition?: (callback: () => void) => {
          ready: Promise<void>;
        };
      };

      if (doc.startViewTransition) {
        const transition = doc.startViewTransition(() => {
          setTheme(newTheme);
        });

        transition.ready.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 500,
              easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        });
      } else {
        setTheme(newTheme);
      }
    },
    [setTheme],
  );

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } catch {
      setIsSigningOut(false);
    }
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.email[0].toUpperCase() ?? "U");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 px-2 hover:bg-muted/80 transition-all duration-200 data-[state=open]:bg-muted"
          suppressHydrationWarning
        >
          <Avatar className="size-7 ring-2 ring-border transition-all duration-200 group-hover:ring-primary/20">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? "User"}
            />
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block text-sm font-medium max-w-25 truncate">
            {user.name ?? "User"}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-0" sideOffset={8}>
        {/* ── User Profile Header ── */}
        <div className="flex items-center gap-3 p-4 bg-muted/30">
          <Avatar className="size-10 ring-2 ring-border shadow-sm">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? "User"}
            />
            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 leading-none min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate">
                {user.name ?? "User"}
              </p>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 font-medium"
              >
                Pro
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* ── Account Section ── */}
        <div className="p-1">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-2 py-1.5">
            Account
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="gap-3 px-2 py-2 cursor-pointer rounded-md"
              onClick={() => router.push("/profile")}
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
                <User className="size-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Profile</span>
                <span className="text-[11px] text-muted-foreground">
                  Manage your profile
                </span>
              </div>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="gap-3 px-2 py-2 cursor-pointer rounded-md"
              onClick={() => router.push("/settings")}
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-orange-500/10">
                <Settings className="size-4 text-orange-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Settings</span>
                <span className="text-[11px] text-muted-foreground">
                  App preferences
                </span>
              </div>
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </DropdownMenuItem>

            {/* <DropdownMenuItem
              className="gap-3 px-2 py-2 cursor-pointer rounded-md"
              onClick={() => router.push("/billing")}
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-emerald-500/10">
                <CreditCard className="size-4 text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Billing</span>
                <span className="text-[11px] text-muted-foreground">
                  Plans & payments
                </span>
              </div>
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem> */}

            {/* <DropdownMenuItem
              className="gap-3 px-2 py-2 cursor-pointer rounded-md"
              onClick={() => router.push("/notifications")}
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-blue-500/10">
                <Bell className="size-4 text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Notifications</span>
                <span className="text-[11px] text-muted-foreground">
                  Alert preferences
                </span>
              </div>
            </DropdownMenuItem> */}
          </DropdownMenuGroup>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* ── Workspace Section ── */}
        <div className="p-1">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-2 py-1.5">
            Workspace
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="gap-3 px-2 py-2 cursor-pointer rounded-md"
              onClick={() => router.push("/teams")}
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-indigo-500/10">
                <Users className="size-4 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Teams</span>
                <span className="text-[11px] text-muted-foreground">
                  Collaborate securely
                </span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="gap-3 px-2 py-2 cursor-pointer rounded-md"
              onClick={() => router.push("/repo")}
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-violet-500/10">
                <FolderGit2 className="size-4 text-violet-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Repositories</span>
                <span className="text-[11px] text-muted-foreground">
                  Your code repos
                </span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="gap-3 px-2 py-2 cursor-pointer rounded-md"
              onClick={() => router.push("/reviews")}
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-pink-500/10">
                <GitPullRequest className="size-4 text-pink-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Reviews</span>
                <span className="text-[11px] text-muted-foreground">
                  Code review history
                </span>
              </div>
            </DropdownMenuItem>

            {/* <DropdownMenuItem
              className="gap-3 px-2 py-2 cursor-pointer rounded-md"
              onClick={() => router.push("/security")}
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-amber-500/10">
                <Shield className="size-4 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Security</span>
                <span className="text-[11px] text-muted-foreground">
                  Access & permissions
                </span>
              </div>
            </DropdownMenuItem> */}
          </DropdownMenuGroup>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* ── Preferences Section ── */}
        <div className="p-1">
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-3 px-2 py-2 cursor-pointer rounded-md">
                <div className="flex items-center justify-center size-8 rounded-md bg-sky-500/10 overflow-hidden">
                  {theme === "light" ? (
                    <Sun className="size-4 text-amber-500 theme-icon-enter" />
                  ) : theme === "dark" ? (
                    <Moon className="size-4 text-blue-400 theme-icon-enter" />
                  ) : (
                    <Monitor className="size-4 text-sky-500 theme-icon-enter" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Theme</span>
                  <span className="text-[11px] text-muted-foreground">
                    {theme === "light"
                      ? "Light"
                      : theme === "dark"
                        ? "Dark"
                        : "System"}
                  </span>
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent
                  className="min-w-[180px]"
                  sideOffset={8}
                  collisionPadding={16}
                >
                  <DropdownMenuItem
                  className="gap-2 cursor-pointer justify-between group/theme-item"
                  onClick={(e) => handleThemeChange("light", e)}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Sun className="size-4 transition-transform duration-300 group-hover/theme-item:rotate-90 group-hover/theme-item:text-amber-500" />
                    </div>
                    <span>Light</span>
                  </div>
                  {theme === "light" && (
                    <Check className="size-4 text-primary theme-check-enter" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer justify-between group/theme-item"
                  onClick={(e) => handleThemeChange("dark", e)}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Moon className="size-4 transition-transform duration-300 group-hover/theme-item:-rotate-12 group-hover/theme-item:scale-110 group-hover/theme-item:text-blue-400" />
                    </div>
                    <span>Dark</span>
                  </div>
                  {theme === "dark" && (
                    <Check className="size-4 text-primary theme-check-enter" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer justify-between group/theme-item"
                  onClick={(e) => handleThemeChange("system", e)}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Monitor className="size-4 transition-transform duration-300 group-hover/theme-item:scale-110 group-hover/theme-item:text-violet-500" />
                    </div>
                    <span>System</span>
                  </div>
                  {theme === "system" && (
                    <Check className="size-4 text-primary theme-check-enter" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {/* <DropdownMenuItem className="gap-3 px-2 py-2 cursor-pointer rounded-md">
              <div className="flex items-center justify-center size-8 rounded-md bg-slate-500/10">
                <Keyboard className="size-4 text-slate-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Keyboard shortcuts</span>
                <span className="text-[11px] text-muted-foreground">
                  View all shortcuts
                </span>
              </div>
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem> */}
          </DropdownMenuGroup>
        </div>

        {/* <DropdownMenuSeparator className="my-0" />

        // ── Support Section ──
        <div className="p-1">
          <DropdownMenuGroup>
            <DropdownMenuItem className="gap-3 px-2 py-2 cursor-pointer rounded-md">
              <div className="flex items-center justify-center size-8 rounded-md bg-teal-500/10">
                <LifeBuoy className="size-4 text-teal-500" />
              </div>
              <span className="text-sm font-medium">Support</span>
              <ExternalLink className="size-3 ml-auto text-muted-foreground" />
            </DropdownMenuItem>

            <DropdownMenuItem className="gap-3 px-2 py-2 cursor-pointer rounded-md">
              <div className="flex items-center justify-center size-8 rounded-md bg-indigo-500/10">
                <MessageSquare className="size-4 text-indigo-500" />
              </div>
              <span className="text-sm font-medium">Feedback</span>
              <ExternalLink className="size-3 ml-auto text-muted-foreground" />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </div> */}

        <DropdownMenuSeparator className="my-0" />

        {/* ── Sign Out ── */}
        <div className="p-1">
          <DropdownMenuItem
            variant="destructive"
            className="gap-3 px-2 py-2 cursor-pointer rounded-md"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <div className="flex items-center justify-center size-8 rounded-md bg-destructive/10">
              {isSigningOut ? (
                <Loader2 className="size-4 text-destructive animate-spin" />
              ) : (
                <LogOut className="size-4 text-destructive" />
              )}
            </div>
            <span className="text-sm font-medium">
              {isSigningOut ? "Signing out..." : "Sign out"}
            </span>
            {!isSigningOut && <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
