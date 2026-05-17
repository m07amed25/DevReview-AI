"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { OverviewTab, PaymentTab, HistoryTab } from "./components";

export default function BillingPage() {
  const { data: user, isLoading } = trpc.profile.get.useQuery();

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setIsUpgrading(false);
    toast.success("Redirecting to Stripe...", {
      description: "Secure payment session is being initialized.",
    });
  };

  const handleAddPayment = async () => {
    setIsAddingPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsAddingPayment(false);
    toast.success("Payment method updated", {
      description: "Your new payment card has been securely saved.",
    });
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    setPromoMessage(null);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setApplyingPromo(false);
    if (promoCode.toUpperCase() === "AWARDS") {
      setPromoMessage({
        type: "success",
        text: "Promo code applied successfully! 20% off your next bill.",
      });
      toast.success("Promo code applied!", {
        description: "20% discount has been applied to your account.",
      });
    } else {
      setPromoMessage({
        type: "error",
        text: "Invalid or expired promo code.",
      });
      toast.error("Invalid promo code", {
        description: "Please check the code and try again.",
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">
            Manage your plan, track usage, and view your billing history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-all hover:shadow-[0_0_25px_-5px_rgba(79,70,229,0.7)]"
          >
            {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            {isUpgrading ? "Connecting to Gateway..." : "Upgrade to Pro"}
          </Button>
        </div>
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
            applyingPromo={applyingPromo}
            handleApplyPromo={handleApplyPromo}
            promoMessage={promoMessage}
          />
        </TabsContent>

        <TabsContent value="payment" className="space-y-6 outline-none">
          <PaymentTab isAddingPayment={isAddingPayment} handleAddPayment={handleAddPayment} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 outline-none">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
