import type { Metadata } from "next";
import { ComingSoonPage } from "@/features/home/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Flexible pricing plans for teams of all sizes — coming soon.",
};

export default function PricingPage() {
  return (
    <ComingSoonPage
      title="Pricing"
      description="Flexible plans for solo developers and growing teams. Fair, transparent pricing is on its way."
    />
  );
}
