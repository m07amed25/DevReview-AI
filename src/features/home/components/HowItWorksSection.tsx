import { Github, Terminal, GitMerge } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Github,
    title: "Connect GitHub",
    description:
      "Sign up and authorize access to your repositories in one click with zero configuration.",
  },
  {
    step: "02",
    icon: Terminal,
    title: "Open a PR",
    description:
      "Code Catch AI automatically triggers on every pull request, analyzing your code in real-time.",
  },
  {
    step: "03",
    icon: GitMerge,
    title: "Merge securely",
    description:
      "Review actionable AI feedback, apply inline suggestions, and ship better code.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative border-t border-white/5 bg-zinc-950/50"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16 sm:mb-20">
          <h2
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-100"
          >
            Up and running in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              minutes
            </span>
          </h2>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Three simple steps to completely transform your engineering
            workflow.
          </p>
        </div>

        <div
          className="steps-container grid gap-8 sm:grid-cols-3 relative"
          role="list"
          aria-label="How it works steps"
        >
          {/* Connecting Line */}
          <div className="hidden sm:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-indigo-500/30 via-blue-500/30 to-indigo-500/30 z-0" />

          {steps.map((item) => (
            <div
              key={item.step}
              className="step-card relative group text-center"
              role="listitem"
            >
              {/* Content */}
              <div className="relative z-10">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-zinc-950 border-8 border-zinc-900 transition-all duration-500 group-hover:scale-110 group-hover:border-indigo-500/20 shadow-xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                    <item.icon
                      className="h-6 w-6 text-indigo-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <div className="inline-block px-3 py-1 mb-4 text-xs font-mono font-medium text-indigo-300 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                    Step {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-200 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-sm max-w-[280px] mx-auto">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
