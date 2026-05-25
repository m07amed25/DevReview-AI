import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { values, milestones, team } from "@/features/home/components/about/about-data";

export const metadata: Metadata = {
  title: "About - Code Catch",
  description: "The team and mission behind Code Catch.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <UnifiedNavbar />
      <main className="mx-auto max-w-[1100px] px-4 sm:px-6 pt-28 pb-20">
        {/* Hero */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Built by developers, for developers</h1>
        <p className="mt-3 text-muted-foreground text-sm sm:text-base max-w-[60ch] leading-relaxed">
          Code Catch was born from a simple frustration: great code was being delayed by slow, inconsistent reviews. We set out to fix that with AI that never sleeps and always has context.
        </p>

        {/* Mission */}
        <section className="mt-16">
          <h2 className="text-lg font-semibold">Our mission</h2>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed max-w-[65ch]">
            <p>We believe code review is the highest-leverage moment in software development, yet it is still largely manual, inconsistent, and painfully slow.</p>
            <p>Our mission is to give every developer an always-available AI reviewer that catches bugs, surfaces security risks, and provides actionable feedback before a single human reviewer is pulled away from building.</p>
          </div>
          <ul className="mt-6 space-y-2 text-sm">
            {["Zero configuration GitHub integration", "Security scanning on every PR, automatically", "Suggestions with context, not just complaints", "Works across languages, frameworks, and team sizes"].map((item) => (
              <li key={item} className="flex items-start gap-2 text-muted-foreground">
                <span className="text-primary mt-0.5">&#8226;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Values */}
        <section className="mt-16">
          <h2 className="text-lg font-semibold">What we believe</h2>
          <div className="mt-6 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 border border-border rounded-sm overflow-hidden">
            {values.map((v) => (
              <div key={v.title} className="bg-background p-5">
                <h3 className="text-[0.9375rem] font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mt-16">
          <h2 className="text-lg font-semibold">How we got here</h2>
          <ol className="mt-6 space-y-6">
            {milestones.map((m) => (
              <li key={m.year} className="flex gap-4">
                <span className="font-mono text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{m.year}</span>
                <div>
                  <h3 className="text-sm font-semibold">{m.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Team */}
        <section className="mt-16">
          <h2 className="text-lg font-semibold">Team</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="flex gap-3">
                <Image
                  src={member.githubPhoto}
                  alt={member.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full bg-muted shrink-0"
                />
                <div>
                  <h3 className="text-sm font-semibold">{member.name}</h3>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{member.description}</p>
                  <div className="mt-1.5 flex gap-2">
                    {member.github && <Link href={member.github} className="text-xs text-primary hover:underline" target="_blank">GitHub</Link>}
                    {member.linkedin && <Link href={member.linkedin} className="text-xs text-muted-foreground hover:text-foreground" target="_blank">LinkedIn</Link>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
