"use client";

import { useState } from "react";
import {
  Zap,
  Rocket,
  Crown,
  Check,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  DollarSign,
  Users,
  GitBranch,
  Bot,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────── */
interface PlanLimit {
  repos: number | "unlimited";
  reviewsPerMonth: number | "unlimited";
  teamSeats: number | "unlimited";
  privateRepos: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: React.ElementType;
  iconColor: string;
  highlight: boolean;
  visible: boolean;
  limits: PlanLimit;
  features: string[];
}

/* ─── Initial data (would come from DB when connected) ──── */
const INITIAL_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Get started for nothing",
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Zap,
    iconColor: "text-slate-500",
    highlight: false,
    visible: true,
    limits: {
      repos: 1,
      reviewsPerMonth: 5,
      teamSeats: 1,
      privateRepos: false,
    },
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
    tagline: "For serious developers",
    monthlyPrice: 24,
    yearlyPrice: 19,
    icon: Rocket,
    iconColor: "text-indigo-500",
    highlight: true,
    visible: true,
    limits: {
      repos: 10,
      reviewsPerMonth: 100,
      teamSeats: 5,
      privateRepos: true,
    },
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
    tagline: "Enterprise-grade power",
    monthlyPrice: 59,
    yearlyPrice: 49,
    icon: Crown,
    iconColor: "text-amber-500",
    highlight: false,
    visible: true,
    limits: {
      repos: "unlimited",
      reviewsPerMonth: "unlimited",
      teamSeats: "unlimited",
      privateRepos: true,
    },
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
];

/* ─── Limit editor ────────────────────────────────────────── */
function LimitField({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  value: number | "unlimited";
  onChange: (v: number | "unlimited") => void;
}) {
  const isUnlimited = value === "unlimited";
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type={isUnlimited ? "text" : "number"}
          value={isUnlimited ? "∞" : value}
          readOnly={isUnlimited}
          min={0}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n) && n >= 0) onChange(n);
          }}
          className="h-8 text-sm"
        />
        <button
          onClick={() => onChange(isUnlimited ? 0 : "unlimited")}
          className={cn(
            "shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors",
            isUnlimited
              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {isUnlimited ? "Unlimited" : "Set unlimited"}
        </button>
      </div>
    </div>
  );
}

/* ─── Plan editor card ────────────────────────────────────── */
function PlanEditorCard({
  plan,
  onSave,
}: {
  plan: PricingPlan;
  onSave: (updated: PricingPlan) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PricingPlan>(plan);
  const [newFeature, setNewFeature] = useState("");

  const Icon = plan.icon;

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
    toast.success(`${draft.name} plan saved`);
  };

  const handleCancel = () => {
    setDraft(plan);
    setEditing(false);
  };

  const addFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    setDraft((d) => ({ ...d, features: [...d.features, trimmed] }));
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    setDraft((d) => ({
      ...d,
      features: d.features.filter((_, i) => i !== index),
    }));
  };

  const updateLimit = (key: keyof PlanLimit, value: number | "unlimited" | boolean) => {
    setDraft((d) => ({ ...d, limits: { ...d.limits, [key]: value } }));
  };

  return (
    <Card
      className={cn(
        "transition-all",
        plan.highlight && "ring-2 ring-indigo-500/40",
        !plan.visible && "opacity-60",
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                plan.id === "free" && "bg-slate-50 dark:bg-slate-900",
                plan.id === "pro" && "bg-indigo-50 dark:bg-indigo-950/40",
                plan.id === "ultra" && "bg-amber-50 dark:bg-amber-950/40",
              )}
            >
              <Icon className={cn("h-5 w-5", plan.iconColor)} />
            </div>
            <div>
              <CardTitle className="text-base">{plan.name}</CardTitle>
              <CardDescription className="text-xs">{plan.tagline}</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Visible toggle */}
            <button
              onClick={() => {
                const updated = { ...plan, visible: !plan.visible };
                onSave(updated);
                toast.success(
                  updated.visible
                    ? `${plan.name} plan is now visible`
                    : `${plan.name} plan hidden`,
                );
              }}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={plan.visible ? "Hide plan" : "Show plan"}
            >
              {plan.visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>

            {/* Highlight toggle */}
            <button
              onClick={() => {
                const updated = { ...plan, highlight: !plan.highlight };
                onSave(updated);
                toast.success(
                  updated.highlight
                    ? `${plan.name} set as featured`
                    : `${plan.name} unfeatured`,
                );
              }}
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                plan.highlight
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title={plan.highlight ? "Remove highlight" : "Set as featured"}
            >
              <BadgeCheck className="h-4 w-4" />
            </button>

            {/* Edit / Save */}
            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleCancel}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleSave}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  setDraft(plan);
                  setEditing(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Monthly price ($)
            </Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={editing ? draft.monthlyPrice : plan.monthlyPrice}
              readOnly={!editing}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  monthlyPrice: parseFloat(e.target.value) || 0,
                }))
              }
              className={cn("h-8 text-sm", !editing && "bg-muted/50")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Annual price ($/mo)
            </Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={editing ? draft.yearlyPrice : plan.yearlyPrice}
              readOnly={!editing}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  yearlyPrice: parseFloat(e.target.value) || 0,
                }))
              }
              className={cn("h-8 text-sm", !editing && "bg-muted/50")}
            />
          </div>
        </div>

        <Separator />

        {/* Limits */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Limits
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <LimitField
              label="Repositories"
              icon={GitBranch}
              value={editing ? draft.limits.repos : plan.limits.repos}
              onChange={(v) => editing && updateLimit("repos", v)}
            />
            <LimitField
              label="AI Reviews / month"
              icon={Bot}
              value={
                editing
                  ? draft.limits.reviewsPerMonth
                  : plan.limits.reviewsPerMonth
              }
              onChange={(v) => editing && updateLimit("reviewsPerMonth", v)}
            />
            <LimitField
              label="Team seats"
              icon={Users}
              value={editing ? draft.limits.teamSeats : plan.limits.teamSeats}
              onChange={(v) => editing && updateLimit("teamSeats", v)}
            />
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" />
                Private repos
              </Label>
              <div className="flex h-8 items-center">
                <Switch
                  checked={
                    editing ? draft.limits.privateRepos : plan.limits.privateRepos
                  }
                  disabled={!editing}
                  onCheckedChange={(v) => editing && updateLimit("privateRepos", v)}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Features */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Feature list
          </h4>
          <ul className="space-y-2">
            {(editing ? draft.features : plan.features).map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                <span className="flex-1 text-sm">{f}</span>
                {editing && (
                  <button
                    title="Remove feature"
                    onClick={() => removeFeature(i)}
                    className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {editing && (
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Add a feature..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFeature()}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={addFeature}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          )}
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              plan.visible
                ? "border-green-500/40 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "border-muted bg-muted/40 text-muted-foreground",
            )}
          >
            {plan.visible ? "Visible" : "Hidden"}
          </Badge>
          {plan.highlight && (
            <Badge
              variant="outline"
              className="border-indigo-500/40 bg-indigo-50 text-xs text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
            >
              Featured
            </Badge>
          )}
          {plan.monthlyPrice === 0 && (
            <Badge
              variant="outline"
              className="border-slate-500/30 text-xs text-muted-foreground"
            >
              Free tier
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function AdminPricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>(INITIAL_PLANS);
  const [annualDiscount, setAnnualDiscount] = useState(20);
  const [trialDays, setTrialDays] = useState(14);
  const [pricingEnabled, setPricingEnabled] = useState(true);

  const handleSavePlan = (updated: PricingPlan) => {
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const visibleCount = plans.filter((p) => p.visible).length;
  const featuredPlan = plans.find((p) => p.highlight);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pricing Management
          </h1>
          <p className="text-muted-foreground">
            Configure plans, limits, and features visible to customers.
          </p>
        </div>
        <Button
          variant="default"
          className="gap-2"
          onClick={() => toast.success("Pricing configuration published!")}
        >
          <Check className="h-4 w-4" />
          Publish Changes
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Visible Plans",
            value: `${visibleCount} / ${plans.length}`,
            icon: Eye,
            color: "text-green-500",
          },
          {
            label: "Featured Plan",
            value: featuredPlan?.name ?? "None",
            icon: BadgeCheck,
            color: "text-indigo-500",
          },
          {
            label: "Annual Discount",
            value: `${annualDiscount}%`,
            icon: DollarSign,
            color: "text-amber-500",
          },
          {
            label: "Trial Days",
            value: `${trialDays} days`,
            icon: Bot,
            color: "text-violet-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className={cn("h-4 w-4", color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="plans">
        <TabsList className="h-10">
          <TabsTrigger value="plans" className="gap-2 text-sm">
            <Crown className="h-3.5 w-3.5" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 text-sm">
            <DollarSign className="h-3.5 w-3.5" />
            Global Settings
          </TabsTrigger>
        </TabsList>

        {/* ── Plans tab ── */}
        <TabsContent value="plans" className="mt-6">
          {/* Warning if no plan is featured */}
          {!featuredPlan && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              No plan is currently featured. Click the{" "}
              <BadgeCheck className="inline h-3.5 w-3.5" /> icon on a plan to
              highlight it on the pricing page.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanEditorCard
                key={plan.id}
                plan={plan}
                onSave={handleSavePlan}
              />
            ))}
          </div>
        </TabsContent>

        {/* ── Global settings tab ── */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-6 max-w-2xl">
            {/* Pricing toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pricing Page</CardTitle>
                <CardDescription>
                  Control whether the public pricing page is accessible.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    Pricing page enabled
                  </p>
                  <p className="text-xs text-muted-foreground">
                    When disabled, visitors see a &quot;Coming Soon&quot; page.
                  </p>
                </div>
                <Switch
                  checked={pricingEnabled}
                  onCheckedChange={(v) => {
                    setPricingEnabled(v);
                    toast.success(
                      v ? "Pricing page enabled" : "Pricing page disabled",
                    );
                  }}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </CardContent>
            </Card>

            {/* Annual discount */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Annual Discount</CardTitle>
                <CardDescription>
                  Percentage savings displayed to users who choose annual
                  billing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Discount percentage (%)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={annualDiscount}
                      onChange={(e) =>
                        setAnnualDiscount(parseInt(e.target.value, 10) || 0)
                      }
                      className="h-8 w-24 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">
                      Users save{" "}
                      <strong>{annualDiscount}%</strong> when billed annually
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    toast.success(`Annual discount set to ${annualDiscount}%`)
                  }
                >
                  <Save className="h-3.5 w-3.5" />
                  Save discount
                </Button>
              </CardContent>
            </Card>

            {/* Trial period */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trial Period</CardTitle>
                <CardDescription>
                  Number of free trial days for new Pro subscribers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Trial duration (days)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      max={90}
                      value={trialDays}
                      onChange={(e) =>
                        setTrialDays(parseInt(e.target.value, 10) || 0)
                      }
                      className="h-8 w-24 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">
                      {trialDays === 0
                        ? "No trial period"
                        : `${trialDays}-day free trial`}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    toast.success(`Trial period set to ${trialDays} days`)
                  }
                >
                  <Save className="h-3.5 w-3.5" />
                  Save trial period
                </Button>
              </CardContent>
            </Card>

            {/* Currency / Billing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billing Currency</CardTitle>
                <CardDescription>
                  Default currency shown on the pricing page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {["USD", "EUR", "GBP", "CAD"].map((cur) => (
                    <button
                      key={cur}
                      title={`Set currency to ${cur}`}
                      onClick={() =>
                        toast.info(
                          `Currency set to ${cur} — connect billing to activate`,
                        )
                      }
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
                        cur === "USD" &&
                          "border-indigo-500/40 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
                      )}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Multi-currency requires Stripe configuration.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
