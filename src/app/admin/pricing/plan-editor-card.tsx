"use client";

import { useState } from "react";
import {
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
  Loader2,
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
import { cn } from "@/lib/utils";
import { PricingPlan, PLAN_DISPLAY, ACCENT_STYLES } from "./types";

function LimitField({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  value: number | null;
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

export function PlanEditorCard({
  plan,
  onSave,
  isSaving,
}: {
  plan: PricingPlan;
  onSave: (updated: PricingPlan) => void;
  isSaving?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PricingPlan>({
    ...plan,
    accentColor: plan.accentColor || "indigo",
  });

  const [prevPlan, setPrevPlan] = useState<PricingPlan | null>(null);

  if (plan && plan !== prevPlan) {
    setPrevPlan(plan);
    setDraft({
      ...plan,
      accentColor: plan.accentColor || "indigo",
    });
  }
  const [newFeature, setNewFeature] = useState("");

  const { icon: Icon } = PLAN_DISPLAY[plan.id] ?? PLAN_DISPLAY.free;

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

  const currentAccent = editing ? draft.accentColor : plan.accentColor;
  const accentStyle = ACCENT_STYLES[currentAccent] || ACCENT_STYLES.slate;

  return (
    <Card
      className={cn(
        "transition-all",
        plan.highlight && `ring-2 ${accentStyle.ring}`,
        !plan.visible && "opacity-60",
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                accentStyle.bg,
                accentStyle.ring.split(" ")[1],
              )}
            >
              <Icon className={cn("h-5 w-5", accentStyle.text)} />
            </div>
            <div>
              <CardTitle className="text-base">{plan.name}</CardTitle>
              <CardDescription className="text-xs">
                {plan.tagline}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onSave({
                  ...plan,
                  visible: !plan.visible,
                  accentColor: plan.accentColor || "indigo",
                })
              }
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={plan.visible ? "Hide plan" : "Show plan"}
            >
              {plan.visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() =>
                onSave({
                  ...plan,
                  highlight: !plan.highlight,
                  accentColor: plan.accentColor || "indigo",
                })
              }
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                plan.highlight
                  ? `${accentStyle.bg} ${accentStyle.text} font-bold`
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title={plan.highlight ? "Remove highlight" : "Set as featured"}
            >
              <BadgeCheck className="h-4 w-4" />
            </button>

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
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
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
                  monthlyPrice: parseInt(e.target.value) || 0,
                }))
              }
              className={cn("h-8 text-sm", !editing && "bg-muted/50")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Annual price (computed)
            </Label>
            <div
              className={cn(
                "flex h-8 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground",
              )}
            >
              Based on Global Settings discount
            </div>
          </div>
        </div>

        {editing && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Tagline
            </Label>
            <Input
              value={draft.tagline}
              onChange={(e) =>
                setDraft((d) => ({ ...d, tagline: e.target.value }))
              }
              className="h-8 text-sm"
              maxLength={200}
            />
          </div>
        )}

        {editing && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Theme Color
            </Label>
            <select
              value={draft.accentColor}
              onChange={(e) =>
                setDraft((d) => ({ ...d, accentColor: e.target.value }))
              }
              className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="slate">Slate</option>
              <option value="indigo">Indigo</option>
              <option value="amber">Amber</option>
              <option value="rose">Rose</option>
              <option value="emerald">Emerald</option>
              <option value="violet">Violet</option>
              <option value="blue">Blue</option>
            </select>
          </div>
        )}

        <Separator />

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Limits
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <LimitField
              label="Repositories"
              icon={GitBranch}
              value={editing ? draft.reposLimit : plan.reposLimit}
              onChange={(v) =>
                editing && setDraft((d) => ({ ...d, reposLimit: v }))
              }
            />
            <LimitField
              label="AI Reviews / month"
              icon={Bot}
              value={editing ? draft.reviewsLimit : plan.reviewsLimit}
              onChange={(v) =>
                editing && setDraft((d) => ({ ...d, reviewsLimit: v }))
              }
            />
            <LimitField
              label="Team seats"
              icon={Users}
              value={editing ? draft.seatsLimit : plan.seatsLimit}
              onChange={(v) =>
                editing && setDraft((d) => ({ ...d, seatsLimit: v }))
              }
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
                  onCheckedChange={(v) =>
                    editing && setDraft((d) => ({ ...d, privateRepos: v }))
                  }
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Feature list
          </h4>
          <ul className="space-y-2">
            {(editing ? draft.features : plan.features).map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check
                  className={cn("h-3.5 w-3.5 shrink-0", accentStyle.text)}
                />
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
