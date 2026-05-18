"use client";

import { GitPullRequest, FileCode, Users, Clock } from "lucide-react";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { trpc } from "@/lib/trpc/client";

const STATS_CONFIG = [
  {
    key: "displayReviews" as const,
    suffix: "+",
    decimals: 0,
    label: "PRs Reviewed",
    icon: GitPullRequest,
    color: "text-indigo-400",
  },
  {
    key: "displayLinesAnalyzed" as const,
    suffix: "K+",
    decimals: 0,
    label: "Lines Analyzed",
    icon: FileCode,
    color: "text-blue-400",
  },
  {
    key: "displayUsers" as const,
    suffix: "+",
    decimals: 0,
    label: "Developers",
    icon: Users,
    color: "text-pink-400",
  },
];

const UPTIME_STAT = {
  value: 99.9,
  suffix: "%",
  decimals: 1,
  label: "Uptime",
  icon: Clock,
  color: "text-emerald-400",
};

export function StatsSection() {
  const [data] = trpc.home.getStats.useSuspenseQuery();

  const stats = [
    ...STATS_CONFIG.map((s) => ({ ...s, value: data[s.key] })),
    UPTIME_STAT,
  ];

  return (
    <section
      className="relative border-t border-border bg-background/80"
      aria-labelledby="stats-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20">
        <div
          className="grid grid-cols-2 gap-8 md:grid-cols-4 md:divide-x divide-border"
          role="list"
          aria-label="Platform statistics"
        >
          {stats.map((stat, i) => (
            <Fade
              key={stat.label}
              delay={i * 150}
              className="text-center group px-4 flex flex-col items-center"
              role="listitem"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 border border-border mb-4 transition-all duration-300 group-hover:bg-muted/60 group-hover:scale-110 group-hover:border-border/80 shadow-lg">
                <stat.icon
                  className={`h-5 w-5 ${stat.color}`}
                  aria-hidden="true"
                />
              </div>
              <div className="stat-value text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-foreground flex items-center justify-center">
                <CountingNumber
                  number={stat.value}
                  decimalPlaces={stat.decimals}
                />
                <span>{stat.suffix}</span>
              </div>
              <div className="text-sm font-medium text-muted-foreground/70 mt-2 uppercase tracking-widest">
                {stat.label}
              </div>
            </Fade>
          ))}
        </div>
      </div>
    </section>
  );
}
