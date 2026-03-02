import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Intercept better-auth's default error page and redirect to a friendly one
  if (request.nextUrl.pathname === "/api/auth/error") {
    const error = request.nextUrl.searchParams.get("error") ?? "unknown";

    // For link-related errors, redirect back to profile with the error
    const linkErrors = [
      "account_already_linked_to_different_user",
      "email_doesn't_match",
      "oauth_account_already_used",
    ];

    const url = request.nextUrl.clone();
    if (linkErrors.includes(error)) {
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
