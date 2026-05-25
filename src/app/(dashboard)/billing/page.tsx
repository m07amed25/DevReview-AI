"use client";

import { useState, lazy, Suspense, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Zap, Loader2, CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { OverviewTab } from "./components";
import { PageHeader } from "@/components/page-header";

const PaymentTab = lazy(() => import("./components").then((m) => ({ default: m.PaymentTab })));
const HistoryTab = lazy(() => import("./components").then((m) => ({ default: m.HistoryTab })));

function TabFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

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
  const discount = useMemo(() => appliedPromos?.[0]
    ? { type: appliedPromos[0].type as "PERCENTAGE" | "FIXED", value: appliedPromos[0].value, planId: appliedPromos[0].planId as string | null }
    : null, [appliedPromos]);

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

  const isFreeUpgrade = (planId: string) => {
    if (!discount) return false;
    if (discount.planId && discount.planId !== planId) return false;
    return discount.type === "PERCENTAGE" && discount.value >= 100;
  };

  const getDiscountedPrice = (planId: string, price: number) => {
    if (!discount) return null;
    if (discount.planId && discount.planId !== planId) return null;
    return discount.type === "PERCENTAGE"
      ? Math.round(price * (1 - discount.value / 100))
      : Math.max(0, price - discount.value);
  };

  const freeUpgrade = trpc.payment.freeUpgrade.useMutation({
    onSuccess: () => {
      toast.success("Plan upgraded successfully!");
      utils.profile.get.invalidate();
      setShowPlanPicker(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleUpgrade = useCallback(() => {
    setShowPlanPicker(true);
  }, []);

  const handleApplyPromo = useCallback(() => {
    if (!promoCode.trim()) return;
    setPromoMessage(null);
    applyPromo.mutate({ code: promoCode.trim() });
  }, [promoCode, applyPromo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<CreditCard className="size-4.5 text-primary" />}
        title="Billing & Subscription"
        description="Manage your plan, payment methods, and billing history."
        actions={
          user.planId === "free" ? (
            <Button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              {isUpgrading ? "Connecting..." : "Upgrade Plan"}
            </Button>
          ) : (
            <Badge variant="secondary" className="h-9 px-4 text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              {user.plan.name} Plan Active
            </Badge>
          )
        }
      />

      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-md">
          <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm px-5 text-sm">Overview</TabsTrigger>
          <TabsTrigger value="payment" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm px-5 text-sm">Payment Methods</TabsTrigger>
          <TabsTrigger value="history" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm px-5 text-sm">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none">
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
            discount={discount && (!discount.planId || discount.planId === user.planId) ? discount : null}
            accountCredit={user.accountCredit}
          />
        </TabsContent>

        <TabsContent value="payment" className="space-y-6 outline-none">
          <Suspense fallback={<TabFallback />}>
            <PaymentTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 outline-none">
          <Suspense fallback={<TabFallback />}>
            <HistoryTab />
          </Suspense>
        </TabsContent>
      </Tabs>

      <Dialog open={showPlanPicker} onOpenChange={setShowPlanPicker}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose a Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {upgradePlans?.map((p) => {
              const free = isFreeUpgrade(p.id);
              const discounted = getDiscountedPrice(p.id, p.monthlyPrice);
              return (
              <button
                key={p.id}
                disabled={freeUpgrade.isPending}
                onClick={() => {
                  if (free) {
                    freeUpgrade.mutate({ planId: p.id, billingCycle: "monthly" });
                  } else {
                    setShowPlanPicker(false);
                    window.location.href = `/billing/pay?plan=${p.id}&cycle=monthly`;
                  }
                }}
                className="w-full p-4 rounded-md border border-border hover:border-primary/50 text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.9375rem] font-semibold leading-tight">{p.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.tagline}</p>
                  </div>
                  {free ? (
                    <span className="font-mono text-base font-semibold text-emerald-500">FREE</span>
                  ) : discounted !== null ? (
                    <span className="font-mono text-base font-semibold">
                      <span className="text-emerald-500">${discounted}</span>
                      <span className="text-xs text-muted-foreground line-through ml-1">${p.monthlyPrice}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </span>
                  ) : (
                    <span className="font-mono text-base font-semibold">${p.monthlyPrice}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {p.features.slice(0, 3).map((f, i) => (
                    <span key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />{f}
                    </span>
                  ))}
                </div>
              </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
