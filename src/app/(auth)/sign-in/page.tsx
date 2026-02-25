"use client";

import { FaGithub } from "react-icons/fa";
import { AlertCircle, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
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
import gsap from "gsap";
import {
  AuroraBackground,
  GridBackground,
} from "@/components/animations/backgrounds";

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
      },
    );
  }, []);

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

  const handleGithubSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      await signIn.social({
        provider: "github",
        callbackURL: "/repo",
      });
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
        <CardContent className="space-y-4">
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
                onClick={() => setError("")}
                className="shrink-0 rounded-md p-0.5 text-red-800/70 transition-colors hover:text-red-800 dark:text-red-300/70 dark:hover:text-red-300"
              >
                <X className="size-4" />
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

          {/* Developer Credit */}
          <div className="mt-6 pt-4 border-t border-border/30 text-center pb-4">
            <p className="text-xs text-muted-foreground">
              Developed by{" "}
              <a
                href="mailto:m07hamedreda25@gmail.com"
                className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              >
                Mohamed Reda
              </a>{" "}
              -{" "}
              <a
                href="mailto:m07hamedreda25@gmail.com"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                m07hamedreda25@gmail.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
