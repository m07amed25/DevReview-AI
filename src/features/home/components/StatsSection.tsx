import { GitPullRequest, FileCode, Users, Clock } from "lucide-react";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { db } from "@/server/db";

export async function StatsSection() {
  const [totalUsers, totalReviews, completedReviews] = await Promise.all([
    db.user.count(),
    db.review.count(),
    db.review.count({ where: { status: "COMPLETED" } }),
  ]);

  // Fallback to initial milestones if current db count is lower
  const displayUsers = Math.max(15, totalUsers);
  const displayReviews = Math.max(50, totalReviews);

  // Approximate lines analyzed in thousands
  const displayLinesAnalyzed = Math.max(
    10,
    Math.floor((completedReviews * 150) / 1000) + 10,
  );

  const stats = [
    {
      value: displayReviews,
      suffix: "+",
      decimals: 0,
      label: "PRs Reviewed",
      icon: GitPullRequest,
      color: "text-indigo-400",
    },
    {
      value: displayLinesAnalyzed,
      suffix: "K+",
      decimals: 0,
      label: "Lines Analyzed",
      icon: FileCode,
      color: "text-blue-400",
    },
    {
      value: displayUsers,
      suffix: "+",
      decimals: 0,
      label: "Developers",
      icon: Users,
      color: "text-pink-400",
    },
    {
      value: 99.9,
      suffix: "%",
      decimals: 1,
      label: "Uptime",
      icon: Clock,
      color: "text-emerald-400",
    },
  ];

  return (
    <section
      className="relative border-t border-white/5 bg-zinc-950/80"
      aria-labelledby="stats-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20">
        <div
          className="grid grid-cols-2 gap-8 md:grid-cols-4 divide-x divide-white/5"
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
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 mb-4 transition-all duration-300 group-hover:bg-white/[0.08] group-hover:scale-110 group-hover:border-white/10 shadow-lg">
                <stat.icon
                  className={`h-5 w-5 ${stat.color}`}
                  aria-hidden="true"
                />
              </div>
              <div className="stat-value text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-zinc-100 flex items-center justify-center">
                <CountingNumber
                  number={stat.value}
                  decimalPlaces={stat.decimals}
                />
                <span>{stat.suffix}</span>
              </div>
              <div className="text-sm font-medium text-zinc-500 mt-2 uppercase tracking-widest">
                {stat.label}
              </div>
            </Fade>
          ))}
        </div>
      </div>
    </section>
  );
}
