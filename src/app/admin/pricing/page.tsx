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
  Tag,
  Mail,
  CalendarDays,
  Hash,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Percent,
  Building2,
  Globe,
  Lock,
  RotateCcw,
  Receipt,
  SlidersHorizontal,
  CreditCard,
  ShieldAlert,
  ShoppingCart,
  TicketPercent,
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
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  highlight: boolean;
  visible: boolean;
  features: string[];
  reposLimit: number | null;    // null = unlimited
  reviewsLimit: number | null;  // null = unlimited
  seatsLimit: number | null;    // null = unlimited
  privateRepos: boolean;
  sortOrder: number;
}

/* Per-plan display constants (not stored in DB) */
const PLAN_DISPLAY: Record<string, {
  icon: React.ElementType;
  iconColor: string;
}> = {
  free:  { icon: Zap,    iconColor: "text-slate-500" },
  pro:   { icon: Rocket, iconColor: "text-indigo-500" },
  ultra: { icon: Crown,  iconColor: "text-amber-500" },
};

/* ─── Helpers ────────────────────────────────────────────── */
const PLAN_OPTIONS = [
  { value: "all", label: "All plans" },
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "ultra", label: "Ultra" },
];

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        active
          ? "border-green-500/40 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          : "border-muted bg-muted/40 text-muted-foreground",
      )}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

/* ─── Limit editor ────────────────────────────────────────── */
function LimitField({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  value: number | null; // null = unlimited
  onChange: (v: number | null) => void;
}) {
  const isUnlimited = value === null;
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type={isUnlimited ? "text" : "number"}
          value={isUnlimited ? "∞" : (value ?? 0)}
          readOnly={isUnlimited}
          min={0}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n) && n >= 0) onChange(n);
          }}
          className="h-8 text-sm"
        />
        <button
          onClick={() => onChange(isUnlimited ? 0 : null)}
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
  isSaving,
}: {
  plan: PricingPlan;
  onSave: (updated: PricingPlan) => void;
  isSaving?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PricingPlan>(plan);
  const [newFeature, setNewFeature] = useState("");

  const { icon: Icon, iconColor } = PLAN_DISPLAY[plan.id] ?? PLAN_DISPLAY.free;

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
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
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <div>
              <CardTitle className="text-base">{plan.name}</CardTitle>
              <CardDescription className="text-xs">{plan.tagline}</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Visible toggle */}
            <button
              onClick={() => onSave({ ...plan, visible: !plan.visible })}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={plan.visible ? "Hide plan" : "Show plan"}
            >
              {plan.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>

            {/* Highlight toggle */}
            <button
              onClick={() => onSave({ ...plan, highlight: !plan.highlight })}
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
                <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={handleCancel}>
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </Button>
              </>
            ) : (
              <Button
                size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
                onClick={() => { setDraft(plan); setEditing(true); }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pricing — monthly only (annual is computed from global annualDiscount) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Monthly price ($)
            </Label>
            <Input
              type="number" min={0} step={1}
              value={editing ? draft.monthlyPrice : plan.monthlyPrice}
              readOnly={!editing}
              onChange={(e) => setDraft((d) => ({ ...d, monthlyPrice: parseFloat(e.target.value) || 0 }))}
              className={cn("h-8 text-sm", !editing && "bg-muted/50")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Annual price (computed)
            </Label>
            <div className={cn("flex h-8 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground")}>
              Based on Global Settings discount
            </div>
          </div>
        </div>

        {/* Tagline */}
        {editing && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Tagline</Label>
            <Input
              value={draft.tagline}
              onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
              className="h-8 text-sm"
              maxLength={200}
            />
          </div>
        )}

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
              value={editing ? draft.reposLimit : plan.reposLimit}
              onChange={(v) => editing && setDraft((d) => ({ ...d, reposLimit: v }))}
            />
            <LimitField
              label="AI Reviews / month"
              icon={Bot}
              value={editing ? draft.reviewsLimit : plan.reviewsLimit}
              onChange={(v) => editing && setDraft((d) => ({ ...d, reviewsLimit: v }))}
            />
            <LimitField
              label="Team seats"
              icon={Users}
              value={editing ? draft.seatsLimit : plan.seatsLimit}
              onChange={(v) => editing && setDraft((d) => ({ ...d, seatsLimit: v }))}
            />
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" />
                Private repos
              </Label>
              <div className="flex h-8 items-center">
                <Switch
                  checked={editing ? draft.privateRepos : plan.privateRepos}
                  disabled={!editing}
                  onCheckedChange={(v) => editing && setDraft((d) => ({ ...d, privateRepos: v }))}
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
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={addFeature}>
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
            <Badge variant="outline" className="border-indigo-500/40 bg-indigo-50 text-xs text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
              Featured
            </Badge>
          )}
          {plan.monthlyPrice === 0 && (
            <Badge variant="outline" className="border-slate-500/30 text-xs text-muted-foreground">
              Free tier
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Discounts tab ──────────────────────────────────────── */
function DiscountsTab() {
  const utils = trpc.useUtils();
  const [discounts] = trpc.adminPricing.listDiscounts.useSuspenseQuery();

  const createMutation = trpc.adminPricing.createDiscount.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listDiscounts.invalidate();
      toast.success("Discount code created");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.adminPricing.deleteDiscount.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listDiscounts.invalidate();
      toast.success("Discount code deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.adminPricing.toggleDiscount.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listDiscounts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [planId, setPlanId] = useState("all");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setCode(""); setDescription(""); setType("PERCENTAGE"); setValue("");

    setPlanId("all"); setMaxUses(""); setExpiresAt(""); setShowForm(false);
  };

  const handleCreate = () => {
    const numValue = parseFloat(value);
    if (!code.trim()) return toast.error("Code is required");
    if (isNaN(numValue) || numValue <= 0) return toast.error("Value must be > 0");
    if (type === "PERCENTAGE" && numValue > 100) return toast.error("Percentage cannot exceed 100");
    createMutation.mutate({
      code: code.toUpperCase(),
      description: description || undefined,
      type,
      value: numValue,
      planId: planId === "all" ? null : (planId as "free" | "pro" | "ultra"),
      maxUses: maxUses ? parseInt(maxUses, 10) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Discount Codes</h2>
          <p className="text-xs text-muted-foreground">
            Coupon codes that reduce the price at checkout — percentage or fixed amount.
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          New Code
        </Button>
      </div>

      {showForm && (
        <Card className="border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Create Discount Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="SUMMER25"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="h-8 font-mono text-sm uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                <Input
                  placeholder="Summer 2025 promo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Percent className="h-3.5 w-3.5" />
                  Discount type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED")}
                  className="h-8 text-sm"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed amount ($)</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Value {type === "PERCENTAGE" ? "(%)" : "($)"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number" min={0} max={type === "PERCENTAGE" ? 100 : undefined}
                  step={type === "PERCENTAGE" ? 1 : 0.01}
                  placeholder={type === "PERCENTAGE" ? "25" : "5.00"}
                  value={value} onChange={(e) => setValue(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Crown className="h-3.5 w-3.5" />
                  Apply to plan
                </Label>
                <Select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="h-8 text-sm"
                >
                  {PLAN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" />
                  Max uses (blank = unlimited)
                </Label>
                <Input
                  type="number" min={1} placeholder="100"
                  value={maxUses} onChange={(e) => setMaxUses(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Expires at (blank = never)
                </Label>
                <Input
                  type="datetime-local" value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)} className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="gap-1.5 text-xs" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={resetForm}>
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <Tag className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No discount codes yet.</p>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Create your first code
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {["Code", "Discount", "Plan", "Uses", "Expires", "Status", ""].map((h) => (
                  <th key={h} className={cn("px-4 py-2.5 text-xs font-semibold text-muted-foreground", h === "" ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {discounts.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold tracking-wide">{d.code}</span>
                    {d.description && <p className="mt-0.5 text-xs text-muted-foreground">{d.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-xs",
                      d.type === "PERCENTAGE"
                        ? "border-violet-500/40 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400"
                        : "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                    )}>
                      {d.type === "PERCENTAGE" ? `${d.value}%` : `$${d.value.toFixed(2)}`}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">{d.planId ?? "All plans"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {d.usedCount}{d.maxUses !== null ? ` / ${d.maxUses}` : " / ∞"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(d.expiresAt)}</td>
                  <td className="px-4 py-3"><StatusBadge active={d.active} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button title={d.active ? "Deactivate" : "Activate"}
                        onClick={() => toggleMutation.mutate({ id: d.id, active: !d.active })}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        {d.active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button title="Delete"
                        onClick={() => { if (confirm(`Delete code "${d.code}"?`)) deleteMutation.mutate({ id: d.id }); }}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── User overrides tab ─────────────────────────────────── */
function OverridesTab() {
  const utils = trpc.useUtils();
  const [overrides] = trpc.adminPricing.listOverrides.useSuspenseQuery();

  const createMutation = trpc.adminPricing.createOverride.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listOverrides.invalidate();
      toast.success("Price override created");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.adminPricing.deleteOverride.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listOverrides.invalidate();
      toast.success("Price override deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.adminPricing.toggleOverride.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listOverrides.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState<"free" | "pro" | "ultra">("pro");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [yearlyPrice, setYearlyPrice] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setEmail(""); setPlanId("pro"); setMonthlyPrice(""); setYearlyPrice("");
    setReason(""); setExpiresAt(""); setShowForm(false);
  };

  const handleCreate = () => {
    if (!email.trim()) return toast.error("Email is required");
    if (!monthlyPrice && !yearlyPrice)
      return toast.error("At least one of monthly or yearly price is required");
    createMutation.mutate({
      email: email.trim().toLowerCase(),
      planId,
      overrideMonthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : null,
      overrideYearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
      reason: reason || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">User Price Overrides</h2>
          <p className="text-xs text-muted-foreground">
            Grant specific users a custom monthly or yearly price on any plan.
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          New Override
        </Button>
      </div>

      {showForm && (
        <Card className="border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Create Price Override</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Email address <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email" placeholder="user@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Crown className="h-3.5 w-3.5" />
                  Plan <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value as "free" | "pro" | "ultra")}
                  className="h-8 text-sm"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="ultra">Ultra</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Reason (internal note)
                </Label>
                <Input
                  placeholder="e.g. Partner discount"
                  value={reason} onChange={(e) => setReason(e.target.value)} className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Override monthly price ($)
                </Label>
                <Input
                  type="number" min={0} step={0.01} placeholder="12.00"
                  value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Override yearly price ($/mo)
                </Label>
                <Input
                  type="number" min={0} step={0.01} placeholder="9.00"
                  value={yearlyPrice} onChange={(e) => setYearlyPrice(e.target.value)} className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Expires at (blank = never)
                </Label>
                <Input
                  type="datetime-local" value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)} className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="gap-1.5 text-xs" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={resetForm}>
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {overrides.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <Mail className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No user price overrides yet.</p>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add first override
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {["Email", "Plan", "Monthly", "Yearly", "Expires", "Status", ""].map((h) => (
                  <th key={h} className={cn("px-4 py-2.5 text-xs font-semibold text-muted-foreground", h === "" ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {overrides.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <span className="font-medium">{o.email}</span>
                    {o.reason && <p className="mt-0.5 text-xs text-muted-foreground">{o.reason}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-xs capitalize",
                      o.planId === "free" && "border-slate-500/30 text-muted-foreground",
                      o.planId === "pro" && "border-indigo-500/40 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
                      o.planId === "ultra" && "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                    )}>{o.planId}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {o.overrideMonthlyPrice !== null ? `$${o.overrideMonthlyPrice.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {o.overrideYearlyPrice !== null ? `$${o.overrideYearlyPrice.toFixed(2)}/mo` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(o.expiresAt)}</td>
                  <td className="px-4 py-3"><StatusBadge active={o.active} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button title={o.active ? "Deactivate" : "Activate"}
                        onClick={() => toggleMutation.mutate({ id: o.id, active: !o.active })}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        {o.active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button title="Delete"
                        onClick={() => { if (confirm(`Remove price override for ${o.email}?`)) deleteMutation.mutate({ id: o.id }); }}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Partners tab ──────────────────────────────────────── */
function PartnersTab() {
  const utils = trpc.useUtils();
  const [partners] = trpc.adminPricing.listPartners.useSuspenseQuery();

  const createMutation = trpc.adminPricing.createPartner.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listPartners.invalidate();
      toast.success("Partner domain added");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.adminPricing.deletePartner.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.listPartners.invalidate();
      toast.success("Partner domain removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.adminPricing.togglePartner.useMutation({
    onSuccess: async () => { await utils.adminPricing.listPartners.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [domain, setDomain] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [planId, setPlanId] = useState<"free" | "pro" | "ultra">("pro");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [yearlyPrice, setYearlyPrice] = useState("");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setDomain(""); setCompanyName(""); setPlanId("pro");
    setMonthlyPrice(""); setYearlyPrice(""); setNote("");
    setExpiresAt(""); setShowForm(false);
  };

  const handleCreate = () => {
    if (!domain.trim()) return toast.error("Domain is required");
    if (!companyName.trim()) return toast.error("Company name is required");
    if (!monthlyPrice && !yearlyPrice)
      return toast.error("At least one of monthly or yearly price is required");
    createMutation.mutate({
      domain: domain.trim().toLowerCase(),
      companyName: companyName.trim(),
      planId,
      overrideMonthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : null,
      overrideYearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
      note: note || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Partner Domains</h2>
          <p className="text-xs text-muted-foreground">
            All users whose email matches a partner domain automatically receive
            the configured plan at the overridden price — no code needed.
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          Add Partner
        </Button>
      </div>

      {showForm && (
        <Card className="border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Add Partner Domain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  Domain <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="acme.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase())}
                  className="h-8 font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  Company name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Crown className="h-3.5 w-3.5" />
                  Plan <span className="text-destructive">*</span>
                </Label>
                <select
                  aria-label="Plan"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value as "free" | "pro" | "ultra")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Internal note
                </Label>
                <Input
                  placeholder="e.g. 2-year partnership agreement"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Override monthly price ($)
                </Label>
                <Input
                  type="number" min={0} step={0.01} placeholder="12.00"
                  value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Override yearly price ($/mo billed annually)
                </Label>
                <Input
                  type="number" min={0} step={0.01} placeholder="9.00"
                  value={yearlyPrice} onChange={(e) => setYearlyPrice(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Partnership expires (blank = never)
                </Label>
                <Input
                  type="datetime-local" value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)} className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="gap-1.5 text-xs" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Plus className="h-3.5 w-3.5" />}
                Add Partner
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={resetForm}>
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No partner domains yet.</p>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add first partner
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {["Company", "Domain", "Plan", "Monthly", "Yearly", "Expires", "Status", ""].map((h) => (
                  <th key={h} className={cn("px-4 py-2.5 text-xs font-semibold text-muted-foreground", h === "" ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {partners.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <span className="font-medium">{p.companyName}</span>
                    {p.note && <p className="mt-0.5 text-xs text-muted-foreground">{p.note}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">@{p.domain}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-xs capitalize",
                      p.planId === "free" && "border-slate-500/30 text-muted-foreground",
                      p.planId === "pro" && "border-indigo-500/40 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
                      p.planId === "ultra" && "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                    )}>{p.planId}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.overrideMonthlyPrice !== null ? `$${p.overrideMonthlyPrice.toFixed(2)}/mo` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.overrideYearlyPrice !== null ? `$${p.overrideYearlyPrice.toFixed(2)}/mo` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(p.expiresAt)}</td>
                  <td className="px-4 py-3"><StatusBadge active={p.active} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title={p.active ? "Deactivate" : "Activate"}
                        onClick={() => toggleMutation.mutate({ id: p.id, active: !p.active })}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {p.active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button
                        title="Remove"
                        onClick={() => { if (confirm(`Remove partner domain "${p.domain}"?`)) deleteMutation.mutate({ id: p.id }); }}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function AdminPricingPage() {
  /* ── Plans (loaded from DB) ── */
  const utils = trpc.useUtils();
  const [dbPlans] = trpc.adminPricing.listPlans.useSuspenseQuery();
  const savePlanMutation = trpc.adminPricing.savePlan.useMutation({
    onSuccess: async (_, vars) => {
      await utils.adminPricing.listPlans.invalidate();
      toast.success(`${vars.name} plan saved`);
    },
    onError: (e) => toast.error(e.message),
  });

  const plans: PricingPlan[] = dbPlans.map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    monthlyPrice: p.monthlyPrice,
    highlight: p.highlight,
    visible: p.visible,
    features: p.features,
    reposLimit: p.reposLimit,
    reviewsLimit: p.reviewsLimit,
    seatsLimit: p.seatsLimit,
    privateRepos: p.privateRepos,
    sortOrder: p.sortOrder,
  }));

  const handleSavePlan = (updated: PricingPlan) => {
    savePlanMutation.mutate({
      id: updated.id as "free" | "pro" | "ultra",
      name: updated.name,
      tagline: updated.tagline,
      monthlyPrice: updated.monthlyPrice,
      highlight: updated.highlight,
      visible: updated.visible,
      features: updated.features,
      reposLimit: updated.reposLimit,
      reviewsLimit: updated.reviewsLimit,
      seatsLimit: updated.seatsLimit,
      privateRepos: updated.privateRepos,
    });
  };
  const [settings] = trpc.adminPricing.getSettings.useSuspenseQuery();
  const saveSettingsMutation = trpc.adminPricing.saveSettings.useMutation({
    onSuccess: async () => {
      await utils.adminPricing.getSettings.invalidate();
      setSettingsSaved(true);
      toast.success("Global settings saved");
      setTimeout(() => setSettingsSaved(false), 2000);
    },
    onError: (e) => toast.error(e.message),
  });

  const [annualDiscount, setAnnualDiscount] = useState(settings.annualDiscount);
  const [trialDays, setTrialDays] = useState(settings.trialDays);
  const [pricingEnabled, setPricingEnabled] = useState(settings.pricingEnabled);
  const [trialPlan, setTrialPlan] = useState<"pro" | "ultra">(settings.trialPlan as "pro" | "ultra");
  const [gracePeriodDays, setGracePeriodDays] = useState(settings.gracePeriodDays);
  const [refundEnabled, setRefundEnabled] = useState(settings.refundEnabled);
  const [refundWindowDays, setRefundWindowDays] = useState(settings.refundWindowDays);
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled);
  const [taxRate, setTaxRate] = useState(settings.taxRate);
  const [promoCodesAtCheckout, setPromoCodesAtCheckout] = useState(settings.promoCodesAtCheckout);
  const [freeSignupEnabled, setFreeSignupEnabled] = useState(settings.freeSignupEnabled);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const saveAllSettings = () => {
    saveSettingsMutation.mutate({
      pricingEnabled,
      annualDiscount,
      trialDays,
      trialPlan,
      gracePeriodDays,
      refundEnabled,
      refundWindowDays,
      taxEnabled,
      taxRate,
      promoCodesAtCheckout,
      freeSignupEnabled,
    });
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
            Configure plans, discount codes, and per-user price overrides.
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
          <TabsTrigger value="discounts" className="gap-2 text-sm">
            <Tag className="h-3.5 w-3.5" />
            Discounts
          </TabsTrigger>
          <TabsTrigger value="overrides" className="gap-2 text-sm">
            <Mail className="h-3.5 w-3.5" />
            User Overrides
          </TabsTrigger>
          <TabsTrigger value="partners" className="gap-2 text-sm">
            <Building2 className="h-3.5 w-3.5" />
            Partners
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
                isSaving={savePlanMutation.isPending}
              />
            ))}
          </div>
        </TabsContent>

        {/* ── Discounts tab ── */}
        <TabsContent value="discounts" className="mt-6">
          <DiscountsTab />
        </TabsContent>

        {/* ── User overrides tab ── */}
        <TabsContent value="overrides" className="mt-6">
          <OverridesTab />
        </TabsContent>

        {/* ── Partners tab ── */}
        <TabsContent value="partners" className="mt-6">
          <PartnersTab />
        </TabsContent>

        {/* ── Global settings tab ── */}
        <TabsContent value="settings" className="mt-6">
          <div className="max-w-4xl space-y-6">

            {/* ── Section: Visibility & Access ── */}
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              Visibility &amp; Access
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Pricing page toggle */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Pricing Page</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    When disabled, visitors see a &ldquo;Coming Soon&rdquo; message instead.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {pricingEnabled ? "Live" : "Hidden"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pricingEnabled ? "Pricing page is publicly visible." : "Pricing page is hidden from visitors."}
                      </p>
                    </div>
                    <Switch
                      checked={pricingEnabled}
                      onCheckedChange={(v) => {
                        setPricingEnabled(v);
                        toast.success(v ? "Pricing page enabled" : "Pricing page hidden");
                      }}
                      className="data-[state=checked]:bg-indigo-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Free signup */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Free Plan Signup</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Allow new users to sign up directly on the Free plan without entering payment details.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {freeSignupEnabled ? "Allowed" : "Disabled"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {freeSignupEnabled ? "Users can sign up for free." : "Payment required at signup."}
                      </p>
                    </div>
                    <Switch
                      checked={freeSignupEnabled}
                      onCheckedChange={setFreeSignupEnabled}
                      className="data-[state=checked]:bg-indigo-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Section: Billing ── */}
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              Billing
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Currency — locked to USD */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Billing Currency</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    All prices are charged in US Dollars.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-indigo-500/30 bg-indigo-50/50 px-4 py-3 dark:bg-indigo-900/20">
                    <span className="text-xl font-bold text-indigo-700 dark:text-indigo-400">$</span>
                    <div>
                      <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">USD &mdash; United States Dollar</p>
                      <p className="text-xs text-muted-foreground">Fixed currency — not configurable</p>
                    </div>
                    <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Multi-currency support is not available at this time.
                  </p>
                </CardContent>
              </Card>

              {/* Annual discount */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TicketPercent className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Annual Discount</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Percentage savings displayed when users switch to annual billing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min={0} max={80} step={5}
                      aria-label="Annual discount percentage"
                      value={annualDiscount}
                      onChange={(e) => setAnnualDiscount(parseInt(e.target.value, 10))}
                      className="h-2 w-full cursor-pointer accent-indigo-500"
                    />
                    <span className="min-w-14 rounded-md border border-indigo-500/30 bg-indigo-50 px-2 py-1 text-center text-sm font-bold text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                      {annualDiscount}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Users save <strong>{annualDiscount}%</strong> when billed annually.
                  </p>
                </CardContent>
              </Card>

              {/* Grace period */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Payment Grace Period</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Days after a failed payment before the subscription is downgraded to Free.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min={0} max={14} step={1}
                      aria-label="Grace period days"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(parseInt(e.target.value, 10))}
                      className="h-2 w-full cursor-pointer accent-amber-500"
                    />
                    <span className="min-w-14 rounded-md border border-amber-500/30 bg-amber-50 px-2 py-1 text-center text-sm font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      {gracePeriodDays}d
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {gracePeriodDays === 0
                      ? "Subscription downgraded immediately on payment failure."
                      : `${gracePeriodDays}-day window before downgrade.`}
                  </p>
                </CardContent>
              </Card>

              {/* Checkout promo codes */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Checkout Promo Codes</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Show a promo code field in the checkout flow.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {promoCodesAtCheckout ? "Visible" : "Hidden"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {promoCodesAtCheckout ? "Customers can enter a code at checkout." : "Promo code field is hidden."}
                      </p>
                    </div>
                    <Switch
                      checked={promoCodesAtCheckout}
                      onCheckedChange={setPromoCodesAtCheckout}
                      className="data-[state=checked]:bg-indigo-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Section: Trial ── */}
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Trial Period
            </div>
            <Card>
              <CardContent className="pt-5">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Trial duration
                    </Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range" min={0} max={90} step={7}
                        aria-label="Trial duration days"
                        value={trialDays}
                        onChange={(e) => setTrialDays(parseInt(e.target.value, 10))}
                        className="h-2 w-full cursor-pointer accent-violet-500"
                      />
                      <span className="min-w-14 rounded-md border border-violet-500/30 bg-violet-50 px-2 py-1 text-center text-sm font-bold text-violet-700 dark:bg-violet-900/20 dark:text-violet-400">
                        {trialDays}d
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {trialDays === 0 ? "No free trial." : `New subscribers get a ${trialDays}-day free trial.`}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Crown className="h-3.5 w-3.5" />
                      Trial applies to plan
                    </Label>
                    <select
                      aria-label="Trial plan"
                      value={trialPlan}
                      onChange={(e) => setTrialPlan(e.target.value as "pro" | "ultra")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="pro">Pro</option>
                      <option value="ultra">Ultra</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Only <strong className="capitalize">{trialPlan}</strong> plan subscribers get the free trial.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Section: Refund & Tax ── */}
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Receipt className="h-3.5 w-3.5" />
              Refund &amp; Tax
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Refund policy */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Refund Policy</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Offer a money-back window for paid subscriptions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Refunds enabled</p>
                    <Switch
                      checked={refundEnabled}
                      onCheckedChange={setRefundEnabled}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                  {refundEnabled && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Refund window (days)</Label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range" min={1} max={60} step={1}
                          aria-label="Refund window days"
                          value={refundWindowDays}
                          onChange={(e) => setRefundWindowDays(parseInt(e.target.value, 10))}
                          className="h-2 w-full cursor-pointer accent-green-500"
                        />
                        <span className="min-w-14 rounded-md border border-green-500/30 bg-green-50 px-2 py-1 text-center text-sm font-bold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          {refundWindowDays}d
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Customers can request a refund within {refundWindowDays} days of purchase.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tax settings */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Tax Settings</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Display tax-inclusive pricing on the pricing page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Show tax in prices</p>
                    <Switch
                      checked={taxEnabled}
                      onCheckedChange={setTaxEnabled}
                      className="data-[state=checked]:bg-indigo-500"
                    />
                  </div>
                  {taxEnabled && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Tax rate (%)</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number" min={0} max={50} step={0.5}
                          value={taxRate}
                          onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                          className="h-8 w-24 text-sm"
                        />
                        <span className="text-xs text-muted-foreground">Prices shown +{taxRate}% tax</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Save all ── */}
            <div className="flex items-center justify-end gap-3 rounded-xl border border-dashed px-5 py-4">
              <p className="text-xs text-muted-foreground">Changes are applied to the public pricing page immediately after saving.</p>
              <Button
                size="sm"
                className={cn("gap-1.5 text-xs transition-all", settingsSaved && "bg-green-600 hover:bg-green-600")}
                onClick={saveAllSettings}
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                  : settingsSaved
                  ? <><Check className="h-3.5 w-3.5" /> Saved!</>
                  : <><Save className="h-3.5 w-3.5" /> Save all settings</>}
              </Button>
            </div>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
