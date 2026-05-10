import type { Metadata } from "next";
import { ComingSoonPage } from "@/features/home/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "About",
  description: "Our story and mission — coming soon.",
};

export default function AboutPage() {
  return (
    <ComingSoonPage
      title="About Us"
      description="Learn about the team behind Code Catch, our mission, and why we built AI-powered code review."
    />
  );
}
