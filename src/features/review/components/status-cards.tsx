"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  XCircle,
  Loader2,
  Wand2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";

export function PendingCard() {
  return (
    <Card className="overflow-hidden border-border/60">
      <div className="h-0.75 bg-linear-to-r from-amber-500/60 via-amber-400 to-amber-500/60" />
      <CardContent className="p-0">
        <div className="relative py-14 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-500/6 via-transparent to-transparent" />
          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div
                className="absolute inset-0 size-16 rounded-2xl bg-amber-500/15 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <div className="relative size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Clock className="size-7 text-amber-500" />
              </div>
            </div>
            <h3 className="text-base font-semibold">Queued for Review</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
              Your code review is in the queue and will be processed shortly.
            </p>
            <div className="flex items-center gap-1.5 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-2 rounded-full bg-amber-500"
                  style={{
                    animation: "pendingBounce 1.4s ease-in-out infinite",
                    animationDelay: `${i * 160}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <style>{`
        @keyframes pendingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Card>
  );
}

export function ProcessingCard() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="overflow-hidden border-border/60">
      <div className="h-0.75 bg-linear-to-r from-primary/50 via-primary to-primary/50" />
      <CardContent className="p-0">
        <div className="relative py-14 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          <div className="relative flex flex-col items-center text-center">
            <div className="relative size-20 mb-6">
              <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  strokeWidth="3"
                  className="stroke-muted/40"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="stroke-primary"
                  style={{
                    strokeDasharray: "214",
                    strokeDashoffset: "140",
                    animation: "processingStroke 2s ease-in-out infinite",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles
                  className="size-7 text-primary"
                  style={{
                    animation: "processingPulse 2s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
            <h3 className="text-base font-semibold">Analysing Code{dots}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
              AI is scanning for bugs, security vulnerabilities, performance
              issues, and style improvements
            </p>
            <div className="flex items-center gap-5 mt-8">
              {(["Parsing", "Analysing", "Reporting"] as const).map(
                (step, i) => (
                  <div key={step} className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "size-1.5 rounded-full transition-all",
                        i === 0
                          ? "bg-primary"
                          : i === 1
                            ? "bg-primary animate-pulse"
                            : "bg-muted-foreground/25",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs",
                        i <= 1
                          ? "text-foreground font-medium"
                          : "text-muted-foreground/50",
                      )}
                    >
                      {step}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <style>{`
        @keyframes processingStroke {
          0% { stroke-dashoffset: 214; transform: rotate(0deg); }
          50% { stroke-dashoffset: 80; }
          100% { stroke-dashoffset: 214; transform: rotate(360deg); }
        }
        @keyframes processingPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </Card>
  );
}

export function FailedCard({
  error,
  onRetry,
  isRetrying,
}: {
  error: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <Card className="overflow-hidden border-border/60">
      <div className="h-0.75 bg-linear-to-r from-destructive/50 via-destructive to-destructive/50" />
      <CardContent className="p-0">
        <div className="relative py-14 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-red-500/6 via-transparent to-transparent" />
          <div className="relative text-center">
            <div className="mx-auto size-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6">
              <XCircle className="size-8 text-destructive" />
            </div>
            <h3 className="text-base font-semibold text-destructive">
              Analysis Failed
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
              {error ||
                "An unexpected error occurred. Please try again or contact support."}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                className="mt-8 gap-2 border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40 transition-all"
                onClick={onRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Wand2 className="size-3.5" />
                )}
                {isRetrying ? "Retrying…" : "Retry Analysis"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NoIssuesCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <Card ref={cardRef} className="overflow-hidden border-border/60">
      <div className="h-0.75 bg-linear-to-r from-emerald-500/50 via-emerald-400 to-emerald-500/50" />
      <CardContent className="p-0">
        <div className="relative py-14 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-emerald-500/6 via-transparent to-transparent" />
          <div className="relative text-center">
            <div
              data-check-icon
              className="mx-auto size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              Excellent Code Quality!
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
              No issues were detected in your code. It follows best practices
              and appears to be clean, secure, and well-structured.
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              {["Clean Code", "Secure", "Well-Structured"].map((label) => (
                <Badge
                  key={label}
                  variant="outline"
                  className="border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-xs"
                >
                  <CheckCircle2 className="size-3 mr-1" />
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
