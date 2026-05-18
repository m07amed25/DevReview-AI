import type { Metadata } from "next";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { ProductContent } from "@/features/home/components/ProductContent";

export const metadata: Metadata = {
  title: "Product - Code Catch",
  description:
    "Explore every feature of Code Catch — AI-powered code review, team collaboration, security scanning, analytics, and automated architecture diagrams.",
};

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <UnifiedNavbar />
      <ProductContent />
      <HomeFooter />
    </div>
  );
}
