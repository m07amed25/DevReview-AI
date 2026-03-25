import { GitPullRequest, FileCode, Users, Clock } from "lucide-react";

const stats = [
  { value: "50K+", label: "PRs Reviewed", icon: GitPullRequest },
  { value: "2M+", label: "Lines Analyzed", icon: FileCode },
  { value: "10K+", label: "Developers", icon: Users },
  { value: "99.9%", label: "Uptime", icon: Clock },
];

export function StatsSection() {
  return (
    <section
      className="border-y border-border/40 bg-muted/15"
      aria-labelledby="stats-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div
          className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4"
          role="list"
          aria-label="Platform statistics"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center group" role="listitem">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                <stat.icon
                  className="h-5 w-5 text-primary"
                  aria-hidden="true"
                />
              </div>
              <div className="stat-value text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
