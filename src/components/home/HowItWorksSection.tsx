import { Github, Terminal, GitMerge } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Github,
    title: "Connect GitHub",
    description:
      "Sign up and authorize access to your repositories in one click.",
  },
  {
    step: "02",
    icon: Terminal,
    title: "Open a PR",
    description:
      "CodeReviewAI automatically triggers on every pull request in your repo.",
  },
  {
    step: "03",
    icon: GitMerge,
    title: "Merge with confidence",
    description: "Review AI feedback, apply suggestions, and ship better code.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      className="border-b border-border/40 bg-muted/25"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="text-center mb-12 sm:mb-14">
          <h2
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight"
          >
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform your code review process.
          </p>
        </div>

        <div
          className="grid gap-8 sm:grid-cols-3"
          role="list"
          aria-label="How it works steps"
        >
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="step-card relative group"
              role="listitem"
            >
              {/* Step number */}
              <div className="text-7xl font-bold text-primary/8 absolute -top-3 -left-1 select-none group-hover:text-primary/12 transition-colors duration-300">
                {item.step}
              </div>

              {/* Content */}
              <div className="relative pt-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <item.icon
                    className="h-6 w-6 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed text-sm">
                  {item.description}
                </p>
              </div>

              {/* Connector line */}
              {index < 2 && (
                <div className="hidden sm:block absolute top-15 left-[calc(50%+35px)] w-[calc(100%-70px)] h-px bg-linear-to-r from-primary/20 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
