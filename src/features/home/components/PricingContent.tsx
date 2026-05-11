"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Flame,
  TrendingUp,
  Shield,
  Clock,
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
    tagline: "Zero cost. Real results. Ship today.",
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
    tagline: "10× faster reviews. Zero blind spots.",
    monthlyPrice: 24,
    yearlyPrice: 19,
    color: "from-indigo-500 to-violet-600",
    borderColor: "border-indigo-500/50",
    badge: "Most Popular",
    badgeColor: "bg-linear-to-r from-indigo-500 to-violet-600 text-white",
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
    tagline: "Unlimited scale. Total confidence.",
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
  const savings =
    !yearly && plan.monthlyPrice > 0
      ? (plan.monthlyPrice - plan.yearlyPrice) * 12
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: plan.highlight ? -6 : -4, transition: { duration: 0.2 } }}
      className={cn(
        "group relative flex flex-col rounded-3xl border bg-card p-8 transition-all duration-300",
        plan.highlight
          ? "border-transparent shadow-2xl shadow-indigo-500/25 scale-[1.03] z-10"
          : "border-border/60 hover:border-border hover:shadow-xl",
      )}
    >
      {/* Gradient border for highlighted card */}
      {plan.highlight && (
        <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-indigo-500 via-violet-500 to-purple-600 p-px -z-10">
          <div className="h-full w-full rounded-3xl bg-card" />
        </div>
      )}

      {/* Ambient glow */}
      {plan.highlight && (
        <div className="pointer-events-none absolute -inset-px rounded-3xl bg-linear-to-br from-indigo-500/10 via-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      {plan.id === "ultra" && (
        <div className="pointer-events-none absolute -inset-px rounded-3xl bg-linear-to-br from-amber-500/8 via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.12 + 0.3, type: "spring", stiffness: 200 }}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide shadow-lg",
              plan.badgeColor,
            )}
          >
            {plan.highlight && <Flame className="h-3 w-3" />}
            {plan.id === "ultra" && <Crown className="h-3 w-3" />}
            {plan.badge}
          </motion.span>
        </div>
      )}

      <div className="mb-6 mt-2">
        <div
          className={cn(
            "mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br shadow-lg",
            plan.color,
            plan.highlight && "shadow-indigo-500/40",
            plan.id === "ultra" && "shadow-amber-500/30",
          )}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-2xl font-bold">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <AnimatePresence mode="wait">
            <motion.span
              key={price}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "text-5xl font-extrabold tracking-tight",
                plan.highlight &&
                  "bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent",
                plan.id === "ultra" &&
                  "bg-linear-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent",
              )}
            >
              ${price}
            </motion.span>
          </AnimatePresence>
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
        {savings > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 dark:bg-green-900/30"
          >
            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-xs font-bold text-green-700 dark:text-green-400">
              Save ${savings}/yr switching to annual
            </span>
          </motion.div>
        )}
      </div>

      <Button
        variant={plan.highlight ? "default" : plan.ctaVariant}
        className={cn(
          "mb-8 w-full gap-2 font-bold text-base h-12 transition-all duration-200",
          plan.highlight &&
            "bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 border-0 text-white shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-[1.02]",
          plan.id === "ultra" &&
            "border-amber-500/50 hover:bg-amber-500/10 hover:border-amber-500 hover:scale-[1.02]",
        )}
        size="lg"
        asChild
      >
        <Link href="/sign-up">
          {plan.cta}
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </Button>

      {/* Divider */}
      <div className={cn("mb-6 h-px w-full", plan.highlight ? "bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" : "bg-border/50")} />

      <ul className="flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-sm",
                plan.highlight
                  ? "bg-linear-to-br from-indigo-500 to-violet-600 text-white"
                  : plan.id === "ultra"
                    ? "bg-linear-to-br from-amber-500 to-orange-500 text-white"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <Check className="h-3 w-3" />
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

export function PricingContent() {
  const [yearly, setYearly] = useState(true);

  return (
    <>
      {/* -- Hero -- */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        {/* Multi-layered background glows */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-125 w-150 -translate-x-1/2 rounded-full bg-indigo-500/8 blur-[120px]" />
          <div className="absolute right-1/4 top-20 h-100 w-125 translate-x-1/2 rounded-full bg-violet-500/8 blur-[120px]" />
          <div className="absolute left-1/2 bottom-0 h-75 w-100 -translate-x-1/2 rounded-full bg-purple-500/6 blur-[80px]" />
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
              No surprises. No hidden fees. Just results.
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Pricing that{" "}
            <span className="relative inline-block">
              <span className="bg-linear-to-r from-indigo-500 via-violet-500 to-purple-600 bg-clip-text text-transparent">
                scales with you
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
                className="absolute bottom-1 left-0 h-1 w-full origin-left rounded-full bg-linear-to-r from-indigo-500 to-violet-500 opacity-40"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            Whether you&apos;re a solo dev catching bugs before they ship or a
            50-person team demanding zero-defect merges — there&apos;s a plan
            engineered exactly for you.
          </motion.p>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
          >
            {[
              { icon: Shield, text: "No credit card required" },
              { icon: Clock, text: "14-day free trial" },
              { icon: Zap, text: "Cancel anytime" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-indigo-500" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 inline-flex items-center gap-4 rounded-full border border-border/60 bg-card/80 px-6 py-3 shadow-sm backdrop-blur-sm"
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
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: 1 }}
                className="ml-2 inline-block rounded-full bg-linear-to-r from-green-500 to-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm shadow-green-500/30"
              >
                Save 20%
              </motion.span>
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
      <section className="border-y bg-linear-to-br from-muted/20 via-muted/40 to-muted/20 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Trusted by developers at
          </motion.p>
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
            ].map(({ quote, author, role }, i) => (
              <motion.div
                key={author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="flex-1 text-sm text-muted-foreground leading-relaxed">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{author}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </motion.div>
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
            className="relative overflow-hidden rounded-3xl shadow-2xl shadow-indigo-500/20"
          >
            {/* Gradient border via wrapper */}
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500 via-violet-500 to-purple-600" />
            <div className="relative m-px rounded-3xl bg-linear-to-br from-indigo-500/10 via-background to-violet-600/10 px-10 py-16">
              {/* floating sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="pointer-events-none absolute"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${10 + (i % 3) * 30}%`,
                  }}
                  animate={{
                    y: [0, -12, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 2 + i * 0.4,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                >
                  <Sparkles className="h-3 w-3 text-indigo-400/60" />
                </motion.div>
              ))}

              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40"
              >
                <Rocket className="h-8 w-8 text-white" />
              </motion.div>

              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to ship{" "}
                <span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  better code?
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Join thousands of developers using AI-powered code reviews to
                catch bugs earlier and merge with confidence.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="gap-2 bg-linear-to-r from-indigo-500 to-violet-600 px-10 font-bold text-white shadow-lg shadow-indigo-500/40 hover:from-indigo-600 hover:to-violet-700 border-0 h-13 text-base"
                    asChild
                  >
                    <Link href="/sign-up">
                      Start for free
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 px-10 font-semibold h-13 text-base"
                    asChild
                  >
                    <Link href="/contact">Talk to sales</Link>
                  </Button>
                </motion.div>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                No credit card required · 14-day Pro trial · Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
