"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AuroraBackground,
  GridBackground,
} from "@/components/animations/backgrounds";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenConsumed, setTokenConsumed] = useState(false);

  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 -z-10" aria-hidden="true">
          <AuroraBackground />
          <GridBackground />
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
            <p className="font-medium">Invalid or expired reset link.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Please request a new one.
            </p>
            <Link href="/forgot-password" className="mt-4 block text-sm text-muted-foreground underline-offset-4 hover:underline">
              Request new link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("New password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.resetPassword({ newPassword, token });

      if (res.error) {
        const code = res.error.code ?? "";
        if (code === "INVALID_TOKEN" || code === "TOKEN_EXPIRED") {
          setTokenConsumed(true);
        } else {
          setError(res.error.message ?? "Reset failed. The link may have expired.");
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/sign-in"), 3000);
    } catch {
      setError("Something went wrong. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <AuroraBackground />
        <GridBackground />
      </div>

      <Card className="w-full max-w-md hover-lift transition-all duration-300">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="size-7 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium text-foreground">Password updated!</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to sign in...
                </p>
              </div>
              <Link
                href="/sign-in"
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Sign in now
              </Link>
            </div>
          ) : tokenConsumed ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
                <AlertCircle className="size-7 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium text-foreground">Link already used</p>
                <p className="text-sm text-muted-foreground">
                  This reset link has already been used or has expired.
                  Each link can only be used once.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-500 hover:text-indigo-400 underline-offset-4 hover:underline"
              >
                Request a new reset link
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 animate-in fade-in slide-in-from-top-2 duration-300 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <p className="flex-1">{error}</p>
                  <button
                    type="button"
                    aria-label="Dismiss error"
                    onClick={() => setError("")}
                    className="shrink-0 rounded-md p-0.5 text-red-800/70 transition-colors hover:text-red-800 dark:text-red-300/70 dark:hover:text-red-300"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setShowNew(!showNew)}
                      tabIndex={-1}
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your new password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
