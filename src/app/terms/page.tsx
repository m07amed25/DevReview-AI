import type { Metadata } from "next";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { HomeFooter } from "@/features/home/components/HomeFooter";
import { db } from "@/server/db";
import { LegalMarkdown } from "@/components/legal-markdown";

export const metadata: Metadata = {
  title: "Terms of Service - Code Catch",
  description:
    "Terms of Service for Code Catch — the rules and guidelines for using our AI-powered code review platform.",
};

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const page = await db.legalPage.findUnique({ where: { slug: "terms" } });

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-50">
      <UnifiedNavbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Terms of Service
        </h1>
        {page?.updatedAt && (
          <p className="text-zinc-400 mb-12">
            Last updated: {page.updatedAt.toLocaleDateString()}
          </p>
        )}
        {page?.content ? (
          <LegalMarkdown content={page.content} />
        ) : (
          <p className="text-zinc-400">Terms of Service content is being prepared.</p>
        )}
      </main>
      <HomeFooter />
    </div>
  );
}
