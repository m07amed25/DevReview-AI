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

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtectedRoute) {
    const sessionCookie =
      request.cookies.get("better-auth.session_token")?.value ??
      request.cookies.get("__Secure-better-auth.session_token")?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const sessionUrl = new URL("/api/auth/get-session", request.url);
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
