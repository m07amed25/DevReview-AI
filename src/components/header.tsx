"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FolderGit2, GitPullRequest, ScanSearch } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
}

interface HeaderProps {
  user: User;
}

const navItems = [
  {
    href: "/repo",
    label: "Repositories",
    icon: FolderGit2,
  },
  {
    href: "/reviews",
    label: "Reviews",
    icon: GitPullRequest,
  },
];

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="container">
        <div>
          <nav>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
