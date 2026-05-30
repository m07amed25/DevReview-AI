import { redirect } from "next/navigation";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { PricingContent } from "@/features/home/components/PricingContent";
import { api, HydrateClient } from "@/lib/trpc/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pricing - Code Catch",
  description:
    "Simple, transparent pricing for every team. Free, Pro, and Enterprise plans.",
};

export default async function PricingPage() {
  const [settings, plans, capabilities] = await Promise.all([
    db.pricingSettings.upsert({
      where: { id: "global" },
      create: { id: "global" },
      update: {},
    }),
    db.pricingPlan.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.capability.findMany({
      orderBy: { sortOrder: "asc" },
      include: { plans: { select: { planId: true, enabled: true } } },
    }),
  ]);

  if (!settings.pricingEnabled) {
    redirect("/maintenance");
  }

  void api.home.getRecentUsers.prefetch();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-background">
        <UnifiedNavbar />
        <PricingContent
          settings={settings}
          plans={plans}
          capabilities={capabilities}
        />
        <HomeFooter />
      </div>
    </HydrateClient>
  );
}
