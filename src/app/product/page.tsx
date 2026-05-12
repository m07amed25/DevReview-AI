import type { Metadata } from "next";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { ProductContent } from "@/features/home/components/ProductContent";

export const metadata: Metadata = {
  title: "Product - Code Catch",
  description:
    "Explore every feature of Code Catch — AI-powered code review, team collaboration, security scanning, analytics, and automated architecture diagrams.",
};

export default function ProductPage() {
  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-50">
      <HomeHeader />
      <ProductContent />
      <HomeFooter />
    </div>
  );
}
