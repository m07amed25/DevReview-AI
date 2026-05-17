import type { Metadata } from "next";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { db } from "@/server/db";
import { LegalMarkdown } from "@/components/legal-markdown";

export const metadata: Metadata = {
  title: "Privacy Policy - Code Catch",
  description:
    "Privacy Policy for Code Catch — how we collect, use, and protect your data.",
};

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const page = await db.legalPage.findUnique({ where: { slug: "privacy" } });

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-50">
      <UnifiedNavbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Privacy Policy
        </h1>
        {page?.updatedAt && (
          <p className="text-zinc-400 mb-12">
            Last updated: {page.updatedAt.toLocaleDateString()}
          </p>
        )}
        {page?.content ? (
          <LegalMarkdown content={page.content} />
        ) : (
          <p className="text-zinc-400">Privacy Policy content is being prepared.</p>
        )}
      </main>
      <HomeFooter />
    </div>
  );
}
