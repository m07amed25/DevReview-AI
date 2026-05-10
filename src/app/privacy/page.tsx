import type { Metadata } from "next";
import { ComingSoonPage } from "@/features/home/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we handle your data — coming soon.",
};

export default function PrivacyPage() {
  return (
    <ComingSoonPage
      title="Privacy Policy"
      description="Our full privacy policy — detailing how we collect, use, and protect your data — is being drafted."
    />
  );
}
