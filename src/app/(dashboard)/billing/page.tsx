"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Zap, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { OverviewTab, PaymentTab, HistoryTab } from "./components";

export default function BillingPage() {
  const utils = trpc.useUtils();
  const { data: user, isLoading } = trpc.profile.get.useQuery();

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data: appliedPromos } = trpc.billing.getAppliedPromos.useQuery();
  // Derive active discount from the most recent applied promo
  const discount = appliedPromos?.[0]
    ? { type: appliedPromos[0].type as "PERCENTAGE" | "FIXED", value: appliedPromos[0].value }
    : null;

  const applyPromo = trpc.billing.applyPromo.useMutation({
    onSuccess: (data) => {
      setPromoMessage({ type: "success", text: data.message });
      toast.success("Promo code applied!");
      setPromoCode("");
      utils.billing.getAppliedPromos.invalidate();
    },
    onError: (e) => {
      setPromoMessage({ type: "error", text: e.message });
      toast.error(e.message);
    },
  });

  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const { data: upgradePlans } = trpc.payment.getUpgradePlans.useQuery(undefined, {
    enabled: showPlanPicker,
  });

  const isFreeUpgrade = discount?.type === "PERCENTAGE" && discount.value >= 100;

  const freeUpgrade = trpc.payment.freeUpgrade.useMutation({
    onSuccess: () => {
      toast.success("Plan upgraded successfully!");
      utils.profile.get.invalidate();
      setShowPlanPicker(false);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const handleUpgrade = () => {
    setShowPlanPicker(true);
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    setPromoMessage(null);
    applyPromo.mutate({ code: promoCode.trim() });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">
            Manage your plan, payment methods, and billing history.
          </p>
        </div>
        {user.planId === "free" ? (
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-all hover:shadow-[0_0_25px_-5px_rgba(79,70,229,0.7)]"
          >
            {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            {isUpgrading ? "Connecting..." : "Upgrade Plan"}
          </Button>
        ) : (
          <Badge variant="secondary" className="h-9 px-4 text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            {user.plan.name} Plan Active
          </Badge>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Overview</TabsTrigger>
          <TabsTrigger value="payment" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Payment Methods</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 outline-none">
          <OverviewTab
            plan={user.plan}
            stats={user.stats}
            limits={user.limits}
            isUpgrading={isUpgrading}
            handleUpgrade={handleUpgrade}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            applyingPromo={applyPromo.isPending}
            handleApplyPromo={handleApplyPromo}
            promoMessage={promoMessage}
            discount={discount}
          />
        </TabsContent>

        <TabsContent value="payment" className="space-y-6 outline-none">
          <PaymentTab />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 outline-none">
          <HistoryTab />
        </TabsContent>
      </Tabs>

      <Dialog open={showPlanPicker} onOpenChange={setShowPlanPicker}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose a Plan</DialogTitle>
            {isFreeUpgrade && (
              <p className="text-sm text-emerald-500 font-medium">Your 100% discount applies — no payment required!</p>
            )}
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {upgradePlans?.map((p) => (
              <button
                key={p.id}
                disabled={freeUpgrade.isPending}
                onClick={() => {
                  if (isFreeUpgrade) {
                    freeUpgrade.mutate({ planId: p.id, billingCycle: "monthly" });
                  } else {
                    setShowPlanPicker(false);
                    window.location.href = `/billing/pay?plan=${p.id}&cycle=monthly`;
                  }
                }}
                className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/50 text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.tagline}</p>
                  </div>
                  <span className="text-lg font-bold">{isFreeUpgrade ? "FREE" : `$${p.monthlyPrice}/mo`}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {p.features.slice(0, 3).map((f, i) => (
                    <span key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />{f}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
