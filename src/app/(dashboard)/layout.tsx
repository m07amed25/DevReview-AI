import { Header } from "@/components/header";
import { ErrorBoundary } from "@/components/error-boundary";
import { auth } from "@/server/auth";
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
}

function DashboardContent({
  children,
  user,
}: {
  children: React.ReactNode;
  user: DashboardUser;
}) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <main className="container mx-auto px-4 py-8">{children}</main>
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

  // Transform session user to match DashboardUser interface
  // Provide fallback for name in case it's null/undefined
  const user: DashboardUser = {
    id: session.user.id,
    name: session.user.name ?? "User",
    email: session.user.email,
    image: session.user.image ?? null,
  };

  return <DashboardContent user={user}>{children}</DashboardContent>;
}
