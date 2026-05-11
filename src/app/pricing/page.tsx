import { redirect } from "next/navigation";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { PricingContent } from "@/features/home/components/PricingContent";
import { api, HydrateClient } from "@/lib/trpc/server";
import { db } from "@/server/db";

export const metadata = {
  title: "Pricing - Code Catch",
  description:
    "Simple, transparent pricing for every team. Free, Pro, and Ultra plans.",
};

export default async function PricingPage() {
  const [settings, plans] = await Promise.all([
    db.pricingSettings.upsert({
      where: { id: "global" },
      create: { id: "global" },
      update: {},
    }),
    db.pricingPlan.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!settings.pricingEnabled) {
    redirect("/maintenance");
  }

  void api.home.getRecentUsers.prefetch();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-background">
        <HomeHeader />
        <PricingContent settings={settings} plans={plans} />
        <HomeFooter />
      </div>
    </HydrateClient>
  );
}
