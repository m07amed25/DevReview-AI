import { ErrorBoundary } from "@/components/error-boundary";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GettingStartedChecklist } from "@/components/getting-started-checklist";

function DashboardContent({
  children,
  user,
  onboarding,
}: {
  children: React.ReactNode;
  user: { id: string; name: string; email: string; image?: string | null; role?: string; planId?: string };
  onboarding: { hasGithub: boolean; hasRepos: boolean; hasReviews: boolean };
}) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background lg:flex">
        <DashboardSidebar user={user} />
        <div className="flex-1 min-w-0 pt-14 lg:pt-0">
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Breadcrumbs />
            <GettingStartedChecklist
              hasGithub={onboarding.hasGithub}
              hasRepos={onboarding.hasRepos}
              hasReviews={onboarding.hasReviews}
            />
            {children}
          </main>
          <FeedbackButton />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      accounts: {
        where: { providerId: "github" },
        select: { id: true },
      },
      _count: {
        select: { teamMembers: true, repositories: true, reviews: true },
      },
    },
  });

  const hasGithub = (dbUser?.accounts?.length ?? 0) > 0;
  const hasRepos = (dbUser?._count?.repositories ?? 0) > 0;
  const hasReviews = (dbUser?._count?.reviews ?? 0) > 0;

  return (
    <DashboardContent
      user={{
        id: session.user.id,
        name: session.user.name ?? "User",
        email: session.user.email,
        image: session.user.image,
        role: (session.user as { role?: string }).role,
        planId: (session.user as { planId?: string }).planId,
      }}
      onboarding={{ hasGithub, hasRepos, hasReviews }}
    >
      {children}
    </DashboardContent>
  );
}
