import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/admin",
  "/analytics",
  "/profile",
  "/repo",
  "/reviews",
  "/settings",
  "/teams",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check Maintenance Mode
  const isMaintenancePage = pathname === "/maintenance";
  const isApiRoute = pathname.startsWith("/api");
  const isStaticFile = pathname.startsWith("/_next") || pathname.includes(".");

  const isAppRoute = [
    "/repo",
    "/reviews",
    "/settings",
    "/teams",
    "/profile",
    "/analytics",
    "/admin",
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isAppRoute && !isMaintenancePage && !isApiRoute && !isStaticFile) {
    try {
      const maintenanceUrl = new URL(
        "/api/system/maintenance",
        request.nextUrl.origin,
      );
      const maintenanceRes = await fetch(maintenanceUrl.toString());
      const { maintenanceMode } = await maintenanceRes.json();

      if (maintenanceMode) {
        const sessionUrl = new URL(
          "/api/auth/get-session",
          request.nextUrl.origin,
        );
        const sessionRes = await fetch(sessionUrl.toString(), {
          headers: { cookie: request.headers.get("cookie") ?? "" },
        });
        const data = await sessionRes.json();

        if (data?.user?.role !== "ADMIN") {
          return NextResponse.redirect(new URL("/maintenance", request.url));
        }
      }
    } catch (e) {
      console.error("Maintenance check failed:", e);
    }
  }

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtectedRoute) {
    const sessionCookie =
      request.cookies.get("better-auth.session_token")?.value ??
      request.cookies.get("__Secure-better-auth.session_token")?.value;

    const isValidSession =
      typeof sessionCookie === "string" &&
      sessionCookie.length >= 10 &&
      sessionCookie.length <= 4096 &&
      /^[a-zA-Z0-9\-_.~%+=/]+$/.test(sessionCookie);

    if (!isValidSession) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const sessionUrl = new URL("/api/auth/get-session", request.nextUrl.origin);
    const sessionRes = await fetch(sessionUrl.toString(), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });

    if (!sessionRes.ok) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const data = (await sessionRes.json()) as {
      user?: { id?: string; role?: string };
    } | null;

    if (!data?.user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (pathname.startsWith("/admin") && data.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (pathname === "/api/auth/error") {
    const error = request.nextUrl.searchParams.get("error") ?? "unknown";

    const linkErrors = new Set([
      "account_already_linked_to_different_user",
      "email_doesn't_match",
      "oauth_account_already_used",
    ]);

    const url = request.nextUrl.clone();
    if (linkErrors.has(error)) {
      url.pathname = "/profile";
      url.searchParams.set("auth_error", error);
    } else {
      url.pathname = "/auth-error";
      url.searchParams.set("error", error);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/webhooks|api/inngest|_next/static|_next/image|favicon.ico|images|.*\\\\.svg$).*)",
  ],
};
