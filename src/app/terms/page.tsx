import type { Metadata } from "next";
import { ComingSoonPage } from "@/features/home/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Our terms of service — coming soon.",
};

export default function TermsPage() {
  return (
    <ComingSoonPage
      title="Terms of Service"
      description="Our terms of service outlining the rules and guidelines for using Code Catch are being finalised."
    />
  );
}
