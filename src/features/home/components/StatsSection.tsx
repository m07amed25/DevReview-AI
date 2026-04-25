import { GitPullRequest, FileCode, Users, Clock } from "lucide-react";

const stats = [
  {
    value: "50K+",
    label: "PRs Reviewed",
    icon: GitPullRequest,
    color: "text-indigo-400",
  },
  {
    value: "2M+",
    label: "Lines Analyzed",
    icon: FileCode,
    color: "text-purple-400",
  },
  { value: "10K+", label: "Developers", icon: Users, color: "text-pink-400" },
  { value: "99.9%", label: "Uptime", icon: Clock, color: "text-emerald-400" },
];

export function StatsSection() {
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
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center group px-4"
              role="listitem"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 mb-4 transition-all duration-300 group-hover:bg-white/[0.08] group-hover:scale-110 group-hover:border-white/10 shadow-lg">
                <stat.icon
                  className={`h-5 w-5 ${stat.color}`}
                  aria-hidden="true"
                />
              </div>
              <div className="stat-value text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-zinc-100">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-zinc-500 mt-2 uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
