"use client";

import Link from "next/link";
import { Github, FolderGit2, GitPullRequest, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GettingStartedChecklistProps {
  hasGithub: boolean;
  hasRepos: boolean;
  hasReviews: boolean;
}

const steps = [
  {
    key: "github" as const,
    label: "Connect your GitHub account",
    description: "Link your GitHub to import repositories and review pull requests.",
    href: "/profile",
    icon: Github,
    cta: "Connect GitHub",
  },
  {
    key: "repos" as const,
    label: "Add your first repository",
    description: "Import a repo to start tracking pull requests.",
    href: "/repo",
    icon: FolderGit2,
    cta: "Add Repository",
  },
  {
    key: "reviews" as const,
    label: "Trigger your first review",
    description: "Open a pull request or run a manual review to see AI insights.",
    href: "/reviews",
    icon: GitPullRequest,
    cta: "View Reviews",
  },
];

export function GettingStartedChecklist({ hasGithub, hasRepos, hasReviews }: GettingStartedChecklistProps) {
  const completed = { github: hasGithub, repos: hasRepos, reviews: hasReviews };
  const completedCount = Object.values(completed).filter(Boolean).length;

  if (completedCount === 3) return null;

  return (
    <Card className="mb-6 border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Getting Started</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/3 complete
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => {
          const done = completed[step.key];
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-3 transition-colors",
                done ? "border-primary/20 bg-primary/5" : "border-border"
              )}
            >
              <div className="shrink-0">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>
                  {step.label}
                </p>
                {!done && (
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                )}
              </div>
              {!done && (
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href={step.href}>
                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                    {step.cta}
                  </Link>
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
