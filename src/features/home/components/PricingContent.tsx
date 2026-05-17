"use client";

import { useState, Suspense } from "react";
import { motion } from "motion/react";
import { Sparkles, Shield, Clock, Zap, Rocket, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Plan } from "@/lib/plan";
import {
  PlanCard,
  FaqItem,
  PricingCtaUsers,
  ComparisonTable,
  ACCENT_THEMES,
  PLAN_DISPLAY_MAP,
  buildComparison,
  FAQS,
} from "./pricing";
import type { PricingSettings, DbPricingPlan, MergedPlan } from "./pricing";

export type { PricingSettings, DbPricingPlan } from "./pricing";
export { ACCENT_THEMES } from "./pricing";

export function PricingContent({
  settings,
  plans: dbPlans,
}: {
  settings: PricingSettings;
  plans: DbPricingPlan[];
}) {
  const { annualDiscount, trialDays, trialPlan, freeSignupEnabled } = settings;
  const [yearly, setYearly] = useState(true);

  const mergedPlans: MergedPlan[] = dbPlans.map((p) => {
    const theme = ACCENT_THEMES[p.accentColor] || ACCENT_THEMES.slate;
    return {
      ...p,
      ...(PLAN_DISPLAY_MAP[p.id as Plan] ?? PLAN_DISPLAY_MAP[Plan.FREE]!),
      ...theme,
    };
  });
  const COMPARISON = buildComparison(mergedPlans);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-125 w-150 -translate-x-1/2 rounded-full bg-indigo-500/8 blur-[120px]" />
          <div className="absolute right-1/4 top-20 h-100 w-125 translate-x-1/2 rounded-full bg-violet-500/8 blur-[120px]" />
          <div className="absolute left-1/2 bottom-0 h-75 w-100 -translate-x-1/2 rounded-full bg-purple-500/6 blur-[80px]" />
        </div>

        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="secondary" className="mb-6 gap-1.5 border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              No surprises. No hidden fees. Just results.
            </Badge>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Pricing that{" "}
            <span className="relative inline-block">
              <span className="bg-linear-to-r from-indigo-500 via-violet-500 to-purple-600 bg-clip-text text-transparent">scales with you</span>
              <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }} className="absolute bottom-1 left-0 h-1 w-full origin-left rounded-full bg-linear-to-r from-indigo-500 to-violet-500 opacity-40" />
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Whether you&apos;re a solo dev catching bugs before they ship or a 50-person team demanding zero-defect merges — there&apos;s a plan engineered exactly for you.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="mx-auto mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {[
              { icon: Shield, text: "No credit card required" },
              { icon: Clock, text: trialDays > 0 ? `${trialDays}-day free trial` : "No trial required" },
              { icon: Zap, text: "Cancel anytime" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-indigo-500" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-10 inline-flex items-center gap-4 rounded-full border border-border/60 bg-card/80 px-6 py-3 shadow-sm backdrop-blur-sm">
            <span className={cn("text-sm font-medium transition-colors", !yearly ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
            <Switch checked={yearly} onCheckedChange={setYearly} className="data-[state=checked]:bg-indigo-500" />
            <span className={cn("text-sm font-medium transition-colors", yearly ? "text-foreground" : "text-muted-foreground")}>
              Annual
              <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2.5, delay: 1 }} className="ml-2 inline-block rounded-full bg-linear-to-r from-green-500 to-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm shadow-green-500/30">
                Save {annualDiscount}%
              </motion.span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
          {mergedPlans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} yearly={yearly} index={i} freeSignupEnabled={freeSignupEnabled} annualDiscount={annualDiscount} />
          ))}
        </div>
        {yearly && (
          <p className="mt-4 text-center text-xs text-muted-foreground">* Prices shown per month, billed annually. Save {annualDiscount}% vs monthly.</p>
        )}
      </section>

      {/* Comparison Table */}
      <ComparisonTable plans={mergedPlans} comparison={COMPARISON} />

      {/* Social Proof */}
      <section className="border-y bg-linear-to-br from-muted/20 via-muted/40 to-muted/20 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Trusted by developers at
          </motion.p>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="grid gap-6 md:grid-cols-3">
            {[
              { quote: "Code Catch caught a critical SQL injection I missed in code review. Worth every penny.", author: "Sarah K.", role: "Senior Backend Engineer" },
              { quote: "Went from 3-hour code review cycles to 20 minutes. The Pro plan paid for itself in week one.", author: "Marcus T.", role: "Engineering Lead, Fintech startup" },
              { quote: "Ultra's unlimited seats let our entire 40-person eng team stay in sync without extra overhead.", author: "Priya N.", role: "VP Engineering" },
            ].map(({ quote, author, role }, i) => (
              <motion.div key={author} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="flex-1 text-sm text-muted-foreground leading-relaxed">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">{author[0]}</div>
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

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Frequently asked questions</h2>
          <p className="mt-2 text-muted-foreground">Everything you need to make the right call.</p>
        </div>
        <div>
          {FAQS(trialDays, annualDiscount, trialPlan).map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative overflow-hidden rounded-3xl shadow-2xl shadow-indigo-500/20">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500 via-violet-500 to-purple-600" />
            <div className="relative m-px rounded-3xl bg-linear-to-br from-indigo-500/10 via-background to-violet-600/10 px-10 py-16">
              {[...Array(6)].map((_, i) => (
                <motion.div key={i} className="pointer-events-none absolute" style={{ left: `${15 + i * 15}%`, top: `${10 + (i % 3) * 30}%` }} animate={{ y: [0, -12, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}>
                  <Sparkles className="h-3 w-3 text-indigo-400/60" />
                </motion.div>
              ))}
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40">
                <Rocket className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to ship{" "}
                <span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">better code?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Join thousands of developers using AI-powered code reviews to catch bugs earlier and merge with confidence.</p>
              <Suspense fallback={null}>
                <PricingCtaUsers />
              </Suspense>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="gap-2 bg-linear-to-r from-indigo-500 to-violet-600 px-10 font-bold text-white shadow-lg shadow-indigo-500/40 hover:from-indigo-600 hover:to-violet-700 border-0 h-13 text-base" asChild>
                    <Link href="/sign-up">Start for free <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" variant="outline" className="gap-2 px-10 font-semibold h-13 text-base" asChild>
                    <Link href="/contact">Talk to sales</Link>
                  </Button>
                </motion.div>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">No credit card required · 14-day Pro trial · Cancel anytime</p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
