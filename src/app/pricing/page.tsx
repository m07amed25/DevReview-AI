import { HomeHeader } from "@/features/home/components/HomeHeader";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { PricingContent } from "@/features/home/components/PricingContent";

export const metadata = {
  title: "Pricing – DevReview AI",
  description:
    "Simple, transparent pricing for every team. Free, Pro, and Ultra plans.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <HomeHeader />
      <PricingContent />
      <HomeFooter />
    </div>
  );
}
