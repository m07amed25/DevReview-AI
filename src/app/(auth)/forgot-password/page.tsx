"use client";

import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
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

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const requestReset = trpc.home.requestPasswordReset.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    requestReset.mutate({ email });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <AuroraBackground />
        <GridBackground />
      </div>

      <Card className="w-full max-w-md hover-lift transition-all duration-300">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="size-7 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-foreground">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  If an account exists for <strong>{email}</strong>, you&apos;ll
                  receive a password reset link shortly.
                </p>
                <p className="text-sm text-muted-foreground">
                  The link expires in{" "}
                  <span className="font-medium text-foreground">5 minutes</span>.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Don&apos;t see it? Check your{" "}
                  <span className="font-medium text-foreground">spam or junk folder</span>.
                </p>
              </div>
              <Link
                href="/sign-in"
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Back to sign in
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    disabled={requestReset.isPending}
                  />
                </div>

                <Button type="submit" disabled={requestReset.isPending} className="w-full">
                  {requestReset.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}
