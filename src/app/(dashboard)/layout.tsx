import { Header } from "@/components/header";
import { FeedbackButton } from "@/components/feedback-button";
import { ErrorBoundary } from "@/components/error-boundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Github, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * User type matching the Header component's expectations.
 * This interface is shared across the dashboard layout to ensure type consistency.
 */
export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  role?: string;
}

function DashboardContent({
  children,
  user,
  needsGithubConnection,
}: {
  children: React.ReactNode;
  user: DashboardUser;
  needsGithubConnection: boolean;
}) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Header user={user} />
        {needsGithubConnection && (
          <div className="container mx-auto px-4 pt-6">
            <Alert
              variant="destructive"
              className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <AlertTitle>GitHub Connection Required</AlertTitle>
                  <AlertDescription>
                    You have joined a team but haven&apos;t connected your GitHub
                    account. Code review features won&apos;t work until you
                    connect.
                  </AlertDescription>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-amber-500/50 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500"
              >
                <Link href="/profile">
                  <Github className="mr-2 h-4 w-4" />
                  Connect GitHub
                </Link>
              </Button>
            </Alert>
          </div>
        )}
        <main className="container mx-auto px-4 py-8">{children}</main>
        <FeedbackButton />
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
        select: { teamMembers: true },
      },
    },
  });

  const hasGithub = dbUser?.accounts && dbUser.accounts.length > 0;
  const needsGithubConnection = !hasGithub;

  const user: DashboardUser = {
    id: session.user.id,
    name: session.user.name ?? "User",
    email: session.user.email,
    image: session.user.image ?? null,
    role: dbUser?.role as string | undefined,
  };

  return (
    <DashboardContent user={user} needsGithubConnection={needsGithubConnection}>
      {children}
    </DashboardContent>
  );
}
