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
    <Card className="overflow-hidden border-amber-500/20">
      <CardContent className="p-0">
        <div className="relative py-14 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-500/8 via-transparent to-amber-500/4" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(245,158,11,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(245,158,11,0.08) 0%, transparent 50%)",
            }}
          />
          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div
                className="absolute inset-0 size-16 rounded-2xl bg-amber-500/20 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <div className="relative size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center backdrop-blur-sm">
                <Clock className="size-7 text-amber-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold">Queued for Review</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
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
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="p-0">
        <div className="relative py-14 px-6">
          <div
            className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent"
            style={{ animation: "scanLine 2.5s ease-in-out infinite" }}
          />
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
            <h3 className="text-lg font-semibold">Analysing Code{dots}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
              AI is scanning for bugs, security vulnerabilities, performance
              issues, and style improvements
            </p>
            <div className="flex items-center gap-6 mt-8 text-xs text-muted-foreground">
              {["Parsing", "Analysing", "Reporting"].map((step, i) => (
                <div key={step} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "size-1.5 rounded-full",
                      i === 0
                        ? "bg-primary"
                        : i === 1
                          ? "bg-primary animate-pulse"
                          : "bg-muted-foreground/30",
                    )}
                  />
                  <span className={cn(i <= 1 && "text-foreground")}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; }
        }
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
    <Card className="overflow-hidden border-destructive/20">
      <CardContent className="p-0">
        <div className="relative py-16 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-red-500/8 via-transparent to-red-500/3" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 20px,
                rgba(239,68,68,0.02) 20px,
                rgba(239,68,68,0.02) 21px
              )`,
            }}
          />
          <div className="relative text-center">
            <div className="mx-auto size-18 rounded-2xl bg-linear-to-br from-destructive/15 to-destructive/5 border border-destructive/20 flex items-center justify-center mb-6 shadow-lg shadow-red-500/5">
              <XCircle className="size-9 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-destructive">
              Analysis Failed
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              {error ||
                "An unexpected error occurred. Please try again or contact support."}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                className="mt-8 gap-2 border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40 transition-all"
                onClick={onRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
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
    <Card ref={cardRef} className="overflow-hidden border-emerald-500/20">
      <CardContent className="p-0">
        <div className="relative py-16 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-emerald-500/8 via-transparent to-transparent" />
          <div className="absolute top-6 left-1/4 size-32 rounded-full bg-emerald-500/5 blur-2xl" />
          <div className="absolute bottom-6 right-1/4 size-24 rounded-full bg-emerald-400/5 blur-2xl" />
          <div className="relative text-center">
            <div
              data-check-icon
              className="mx-auto size-20 rounded-2xl bg-linear-to-br from-emerald-500/15 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="size-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
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
                  className="border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
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
