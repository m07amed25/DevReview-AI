import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware — intercepts specific routes before they reach handlers.
 *
 * Currently handles:
 * - Redirecting better-auth's default error page to a user-friendly error UI.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/auth/error") {
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
  matcher: ["/api/auth/error"],
};
