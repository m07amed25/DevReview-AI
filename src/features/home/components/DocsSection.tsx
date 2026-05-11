import { BookOpen, ArrowRight, Github, Code2, GitPullRequest, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const quickStartSteps = [
  {
    icon: Github,
    title: "Sign In with GitHub",
    description: "Connect your GitHub account in seconds",
  },
  {
    icon: Code2,
    title: "Select Repositories",
    description: "Choose which repos to enable AI reviews",
  },
  {
    icon: GitPullRequest,
    title: "Open a Pull Request",
    description: "AI automatically reviews your code",
  },
];

export function DocsSection() {
  return (
    <section
      id="docs"
      className="relative border-t border-white/5 bg-zinc-950"
      aria-labelledby="docs-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center justify-center p-2 bg-indigo-500/10 rounded-2xl mb-6">
            <BookOpen className="h-8 w-8 text-indigo-400" />
          </div>
          <h2
            id="docs-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-100"
          >
            How It Works
          </h2>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Get started with AI-powered code reviews in three simple steps. No installation or configuration required.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {quickStartSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative group p-6 rounded-2xl bg-white/3 border border-white/10 hover:border-indigo-500/30 hover:bg-white/5 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">
                    STEP {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300 group">
            <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              What Gets Reviewed
            </h3>
            <p className="text-zinc-400 mb-4">
              Learn about code quality checks, security vulnerabilities, best practices, and performance optimizations that Code Catch analyzes in your pull requests.
            </p>
            <Button
              variant="ghost"
              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 p-0 h-auto group-hover:translate-x-1 transition-transform"
              asChild
            >
              <a href="#features">
                View features
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group">
            <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <Github className="w-5 h-5 text-blue-400" />
              GitHub Integration
            </h3>
            <p className="text-zinc-400 mb-4">
              Seamlessly integrates with your GitHub workflow. Reviews appear as comments on pull requests, no context switching required.
            </p>
            <Button
              variant="ghost"
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-0 h-auto group-hover:translate-x-1 transition-transform"
              asChild
            >
              <Link href="/sign-up">
                Get started now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
