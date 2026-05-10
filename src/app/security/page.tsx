import type { Metadata } from "next";
import { ComingSoonPage } from "@/features/home/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Security",
  description: "Our security practices and vulnerability disclosure — coming soon.",
};

export default function SecurityPage() {
  return (
    <ComingSoonPage
      title="Security"
      description="Details on our security practices, responsible disclosure policy, and how we keep your code safe."
    />
  );
}
