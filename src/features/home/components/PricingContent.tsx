"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Minus,
  Zap,
  Rocket,
  Crown,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import Link from "next/link";

/* -- Types -- */
interface PlanFeature {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  ultra: boolean | string;
}

/* -- Data -- */
const PLANS = [
  {
    id: "free",
    name: "Free",
    icon: Zap,
    tagline: "Get started for nothing",
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: "from-slate-500 to-slate-600",
    borderColor: "border-border",
    badgeColor: "",
    badge: null,
    cta: "Start Free",
    ctaVariant: "outline" as const,
    highlight: false,
    features: [
      "1 repository",
      "5 AI reviews / month",
      "Basic code analysis",
      "Public repos only",
      "Community support",
      "GitHub integration",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Rocket,
    tagline: "For serious developers",
    monthlyPrice: 24,
    yearlyPrice: 19,
    color: "from-indigo-500 to-violet-600",
    borderColor: "border-indigo-500/50",
    badge: "Most Popular",
    badgeColor: "bg-indigo-500 text-white",
    cta: "Start Pro Trial",
    ctaVariant: "default" as const,
    highlight: true,
    features: [
      "10 repositories",
      "100 AI reviews / month",
      "Advanced code analysis",
      "Public & private repos",
      "Priority email support",
      "GitHub & GitLab integration",
      "Custom review rules",
      "PR inline comments",
      "Team collaboration (5 seats)",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    icon: Crown,
    tagline: "Enterprise-grade power",
    monthlyPrice: 59,
    yearlyPrice: 49,
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-500/40",
    badge: "Best Value",
    badgeColor: "bg-amber-500 text-white",
    cta: "Go Ultra",
    ctaVariant: "outline" as const,
    highlight: false,
    features: [
      "Unlimited repositories",
      "Unlimited AI reviews",
      "Full AI analysis suite",
      "All repo types",
      "24/7 dedicated support + SLA",
      "All Git providers",
      "Custom review rules",
      "PR inline comments",
      "Unlimited team seats",
      "SSO / SAML",
      "Advanced analytics",
      "Custom webhooks",
      "Audit logs",
    ],
  },
] as const;

const COMPARISON: PlanFeature[] = [
  { label: "Repositories", free: "1", pro: "10", ultra: "Unlimited" },
  { label: "AI Reviews / month", free: "5", pro: "100", ultra: "Unlimited" },
  { label: "Team seats", free: "1", pro: "5", ultra: "Unlimited" },
  { label: "Private repos", free: false, pro: true, ultra: true },
  { label: "Custom review rules", free: false, pro: true, ultra: true },
  { label: "PR inline comments", free: false, pro: true, ultra: true },
  { label: "Advanced analytics", free: false, pro: false, ultra: true },
  { label: "SSO / SAML", free: false, pro: false, ultra: true },
  { label: "Custom webhooks", free: false, pro: false, ultra: true },
  { label: "Audit logs", free: false, pro: false, ultra: true },
  { label: "Dedicated support", free: false, pro: false, ultra: true },
  { label: "99.9% SLA", free: false, pro: false, ultra: true },
];

const FAQS = [
  {
    q: "Can I change plans later?",
    a: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.",
  },
  {
    q: "What counts as an AI review?",
    a: "Each pull request or commit batch analysed by our AI engine counts as one review. You can check your usage in your dashboard at any time.",
  },
  {
    q: "Do you offer a free trial for paid plans?",
    a: "Yes! Pro includes a 14-day free trial with no credit card required. Ultra trials are available on request.",
  },
  {
    q: "Is there a discount for annual billing?",
    a: "Yes — switching to annual billing saves you ~20% compared to month-to-month pricing.",
  },
  {
    q: "What happens if I exceed my review limit?",
    a: "We'll notify you before you hit the cap. You can upgrade instantly or wait until your next billing cycle resets.",
  },
  {
    q: "Do you support self-hosted Git servers?",
    a: "Ultra plan supports GitHub Enterprise, GitLab Self-Managed, and Bitbucket Data Center. Contact us for custom setups.",
  },
];

/* -- Sub-components -- */
function PlanCard({
  plan,
  yearly,
  index,
}: {
  plan: (typeof PLANS)[number];
  yearly: boolean;
  index: number;
}) {
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
  const Icon = plan.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-xl",
        plan.borderColor,
        plan.highlight &&
          "ring-2 ring-indigo-500 shadow-indigo-500/10 shadow-xl scale-[1.025] z-10",
      )}
    >
      {plan.badge && (
        <span
          className={cn(
            "absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold tracking-wide",
            plan.badgeColor,
          )}
        >
          {plan.badge}
        </span>
      )}

      <div className="mb-6">
        <div
          className={cn(
            "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br",
            plan.color,
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-5xl font-extrabold tracking-tight">${price}</span>
          {price > 0 && (
            <span className="mb-1.5 text-muted-foreground">
              / mo{yearly ? "*" : ""}
            </span>
          )}
          {price === 0 && (
            <span className="mb-1.5 text-muted-foreground">/ forever</span>
          )}
        </div>
        {yearly && plan.yearlyPrice > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Billed annually (${plan.yearlyPrice * 12}/yr)
          </p>
        )}
        {!yearly && plan.monthlyPrice > 0 && (
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            Save ${(plan.monthlyPrice - plan.yearlyPrice) * 12}/yr with annual
            billing
          </p>
        )}
      </div>

      <Button
        variant={plan.highlight ? "default" : plan.ctaVariant}
        className={cn(
          "mb-8 w-full gap-2 font-semibold",
          plan.highlight &&
            "bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 border-0 text-white shadow-md shadow-indigo-500/30",
        )}
        size="lg"
        asChild
      >
        <Link href="/sign-up">
          {plan.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>

      <ul className="flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                plan.highlight
                  ? "bg-indigo-500 text-white"
                  : plan.id === "ultra"
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <Check className="h-2.5 w-2.5" />
            </span>
            <span className="text-foreground/80">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function ComparisonCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <td className="px-6 py-4 text-center text-sm font-medium">{value}</td>;
  }
  return (
    <td className="px-6 py-4 text-center">
      {value ? (
        <Check className="mx-auto h-4 w-4 text-indigo-500" />
      ) : (
        <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
      )}
    </td>
  );
}

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium transition-colors hover:text-primary"
      >
        <span>{q}</span>
        <HelpCircle
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pb-5 text-sm text-muted-foreground"
        >
          {a}
        </motion.p>
      )}
    </motion.div>
  );
}

/* -- Main client content -- */
export function PricingContent() {
  const [yearly, setYearly] = useState(true);

  return (
    <>
      {/* -- Hero -- */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-150 w-225 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="secondary"
              className="mb-6 gap-1.5 border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Simple, transparent pricing
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Pricing that{" "}
            <span className="bg-linear-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
              scales with you
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            From solo developers shipping side projects to enterprise teams
            demanding reliability — there&apos;s a plan built for you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 inline-flex items-center gap-4 rounded-full border bg-muted/50 px-6 py-3"
          >
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                !yearly ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Monthly
            </span>
            <Switch
              checked={yearly}
              onCheckedChange={setYearly}
              className="data-[state=checked]:bg-indigo-500"
            />
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                yearly ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Annual
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                Save 20%
              </span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* -- Plan Cards -- */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} yearly={yearly} index={i} />
          ))}
        </div>
        {yearly && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            * Prices shown per month, billed annually.
          </p>
        )}
      </section>

      {/* -- Comparison Table -- */}
      <section className="mx-auto max-w-5xl px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Compare all features
          </h2>
          <p className="mt-2 text-muted-foreground">Every detail, side by side.</p>
        </motion.div>

        <div className="overflow-hidden rounded-2xl border shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">
                  Feature
                </th>
                {PLANS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <th
                      key={p.id}
                      className={cn(
                        "px-6 py-4 text-center text-sm font-bold",
                        p.highlight && "text-indigo-600 dark:text-indigo-400",
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Icon className="h-4 w-4" />
                        {p.name}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr
                  key={row.label}
                  className={cn(
                    "border-b last:border-0 transition-colors hover:bg-muted/30",
                    i % 2 === 0 && "bg-muted/10",
                  )}
                >
                  <td className="px-6 py-4 text-sm font-medium">{row.label}</td>
                  <ComparisonCell value={row.free} />
                  <ComparisonCell value={row.pro} />
                  <ComparisonCell value={row.ultra} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* -- Social Proof -- */}
      <section className="border-y bg-muted/30 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-3"
          >
            {[
              {
                quote:
                  "DevReview AI caught a critical SQL injection I missed in code review. Worth every penny.",
                author: "Sarah K.",
                role: "Senior Backend Engineer",
              },
              {
                quote:
                  "Went from 3-hour code review cycles to 20 minutes. The Pro plan paid for itself in week one.",
                author: "Marcus T.",
                role: "Engineering Lead, Fintech startup",
              },
              {
                quote:
                  "Ultra's unlimited seats let our entire 40-person eng team stay in sync without extra overhead.",
                author: "Priya N.",
                role: "VP Engineering",
              },
            ].map(({ quote, author, role }) => (
              <div
                key={author}
                className="flex flex-col gap-4 rounded-2xl border bg-card p-6"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="flex-1 text-sm text-muted-foreground">
                  &ldquo;{quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold">{author}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* -- FAQ -- */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-muted-foreground">
            Everything you need to make the right call.
          </p>
        </div>
        <div>
          {FAQS.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </section>

      {/* -- CTA -- */}
      <section className="pb-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-linear-to-br from-indigo-500 to-violet-600 p-px shadow-2xl shadow-indigo-500/20"
          >
            <div className="rounded-3xl bg-linear-to-br from-indigo-500/10 via-background to-violet-600/10 px-10 py-16">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-indigo-500" />
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to ship better code?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Join thousands of developers using AI-powered code reviews to
                catch bugs earlier and merge with confidence.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  className="gap-2 bg-linear-to-r from-indigo-500 to-violet-600 px-8 font-bold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-violet-700 border-0"
                  asChild
                >
                  <Link href="/sign-up">
                    Start for free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 px-8 font-semibold"
                  asChild
                >
                  <Link href="/contact">Talk to sales</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                No credit card required · 14-day Pro trial · Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
