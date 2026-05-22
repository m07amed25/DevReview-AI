"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Building2, Smartphone, Loader2, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const methodIcons: Record<string, React.ReactNode> = {
  "Card": <CreditCard className="h-8 w-8" />,
  "Fawry": <Building2 className="h-8 w-8" />,
  "MobileWallets": <Smartphone className="h-8 w-8" />,
  "Meeza": <Smartphone className="h-8 w-8" />,
  "Aman": <Building2 className="h-8 w-8" />,
};

export default function PayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") ?? "";
  const billingCycle = (searchParams.get("cycle") as "monthly" | "yearly") ?? "monthly";

  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);

  const { data: methods, isLoading: loadingMethods } = trpc.payment.getPaymentMethods.useQuery();
  const { data: savedCards } = trpc.payment.getSavedCards.useQuery();

  const initiatePayment = trpc.payment.initiatePayment.useMutation({
    onSuccess: (data) => {
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      } else if (data.referenceCode) {
        router.push(`/billing/pending?invoice=${data.invoiceId}&code=${data.referenceCode}`);
      } else {
        router.push(`/billing/success?invoice=${data.invoiceId}`);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const payWithSavedCard = trpc.payment.payWithSavedCard.useMutation({
    onSuccess: (data) => {
      router.push(`/billing/success?invoice=${data.invoiceId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handlePay = () => {
    if (!planId) {
      toast.error("No plan selected");
      return;
    }

    if (savedCardId) {
      payWithSavedCard.mutate({ planId, billingCycle, cardId: savedCardId });
    } else if (selectedMethod) {
      initiatePayment.mutate({ planId, billingCycle, paymentMethodId: selectedMethod });
    }
  };

  const isLoading = initiatePayment.isPending || payWithSavedCard.isPending;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
          <CardDescription>
            {planId ? `Paying for ${planId} (${billingCycle})` : "Choose how you'd like to pay"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Saved Cards */}
          {savedCards && savedCards.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">Saved Cards</h3>
              {savedCards.map((card) => (
                <motion.button
                  key={card.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setSavedCardId(card.id);
                    setSelectedMethod(null);
                  }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                    savedCardId === card.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{card.cardBrand} •••• {card.lastFour}</p>
                      {card.isDefault && (
                        <span className="text-xs text-muted-foreground">Default</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Other Payment Methods</h3>
            {loadingMethods ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : methods && methods.length > 0 ? (
              <div className="grid gap-3">
                {methods.map((method) => (
                  <motion.button
                    key={method.paymentId}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelectedMethod(method.paymentId);
                      setSavedCardId(null);
                    }}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedMethod === method.paymentId
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-muted-foreground">
                        {methodIcons[method.name_en] ?? <CreditCard className="h-8 w-8" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{method.name_en}</p>
                      </div>
                      {method.logo && (
                        <img src={method.logo} alt={method.name_en} className="h-8 w-auto" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Payment methods unavailable. Please verify your Fawaterak API configuration.
              </p>
            )}
          </div>

          <Button
            onClick={handlePay}
            disabled={isLoading || (!selectedMethod && !savedCardId)}
            className="w-full h-12"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Continue to Payment"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
