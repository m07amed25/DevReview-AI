"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, CreditCard } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CardSavedPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  useEffect(() => {
    utils.payment.getSavedCards.invalidate();
    utils.billing.getInfo.invalidate();
  }, [utils]);

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="text-center">
          <CardHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            </motion.div>
            <CardTitle className="text-2xl">Card Saved</CardTitle>
            <CardDescription>
              Your payment method has been saved successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <CreditCard className="h-5 w-5" />
              <span className="text-sm">Your card is ready for future payments</span>
            </div>
            <Button onClick={() => router.push("/billing")} className="w-full">
              Back to Billing
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
