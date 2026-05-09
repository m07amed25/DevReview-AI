"use client";

import { FaGithub } from "react-icons/fa";
import { AlertCircle, Building2, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, authClient } from "@/lib/auth-client";
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
import { Separator } from "@/components/ui/separator";
import {
  AuroraBackground,
  GridBackground,
} from "@/components/animations/backgrounds";

interface FieldErrors {
  email?: string;
  password?: string;
  ssoEmail?: string;
}

function getUrlError(searchParams: Pick<URLSearchParams, "get">): string {
  const code = searchParams.get("error");
  if (!code) return "";
  const desc = searchParams.get("error_description");
  const msg =
    desc ??
    (code === "FORBIDDEN"
      ? "Your account has been banned. Please contact support."
      : "Sign-in failed. Please try again.");
  return decodeURIComponent(msg);
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ssoEmail, setSsoEmail] = useState("");
  const [ssoMode, setSsoMode] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoFieldError, setSsoFieldError] = useState("");
  // Lazily initialise from the URL so we never call setState inside an effect
  const [error, setError] = useState(() => getUrlError(searchParams));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const validateFields = (): boolean => {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateFields()) return;

    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "An error occurred during sign-in.");
      }
      setLoading(false);

      if (!result.error) {
        router.push("/repo");
      }
    } catch {
      setError(
        "Something went wrong. Please check your connection and try again.",
      );
      setLoading(false);
    }
  };

  const validateSsoEmail = (): boolean => {
    const v = ssoEmail.trim();
    if (!v) {
      setSsoFieldError("Work email is required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setSsoFieldError("Please enter a valid email address.");
      return false;
    }
    // must have a domain part (e.g. company.com)
    const domain = v.split("@")[1] ?? "";
    if (!domain.includes(".")) {
      setSsoFieldError("Enter a full work email, e.g. name@company.com.");
      return false;
    }
    setSsoFieldError("");
    return true;
  };

  const handleSsoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSsoEmail()) return;
    setSsoLoading(true);
    setError("");
    try {
      const result = await authClient.signIn.sso({
        email: ssoEmail,
        callbackURL: "/repo",
        errorCallbackURL: "/sign-in",
      });
      if (result?.error) {
        setError(
          result.error.message ??
            "SSO sign-in failed. Please check your work email domain.",
        );
        setSsoLoading(false);
      }
    } catch {
      setError("SSO sign-in failed. Please try again.");
      setSsoLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signIn.social({
        provider: "github",
        // Redirect back here on failure so the ?error param is visible
        callbackURL: "/repo",
        errorCallbackURL: "/sign-in",
      });
      if (result?.error) {
        setError(
          result.error.message ??
            "Failed to connect with GitHub. Please try again.",
        );
        setLoading(false);
      }
    } catch {
      setError("Failed to connect with GitHub. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <AuroraBackground />
        <GridBackground />
      </div>

      <Card
        ref={cardRef}
        className="w-full max-w-md hover-lift transition-all duration-300"
      >
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Enter your email and password to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          <Button
            variant={"outline"}
            onClick={handleGithubSignIn}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FaGithub className="mr-2 size-4" />
            )}
            Sign in with GitHub
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

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

          <form onSubmit={handleEmailSignIn} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                disabled={loading}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  disabled={loading}
                  aria-invalid={!!fieldErrors.password}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-blue-500 font-bold hover:underline"
            >
              Sign up
            </Link>
          </p>

          {/* Enterprise SSO */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Enterprise SSO
              </span>
            </div>
          </div>

          {!ssoMode ? (
            <Button
              variant="outline"
              onClick={() => setSsoMode(true)}
              disabled={loading}
              className="w-full"
            >
              <Building2 className="mr-2 size-4" />
              Sign in with SSO
            </Button>
          ) : (
            <form onSubmit={handleSsoSignIn} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="sso-email">Work email</Label>
                <Input
                  id="sso-email"
                  type="email"
                  placeholder="name@company.com"
                  value={ssoEmail}
                  onChange={(e) => {
                    setSsoEmail(e.target.value);
                    if (ssoFieldError) setSsoFieldError("");
                  }}
                  disabled={ssoLoading}
                  aria-invalid={!!ssoFieldError}
                  aria-describedby={ssoFieldError ? "sso-email-error" : undefined}
                  autoFocus
                />
                {ssoFieldError && (
                  <p
                    id="sso-email-error"
                    className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    {ssoFieldError}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSsoMode(false); setSsoFieldError(""); setSsoEmail(""); }}
                  disabled={ssoLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={ssoLoading}
                  className="flex-1"
                >
                  {ssoLoading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Continue with SSO
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
