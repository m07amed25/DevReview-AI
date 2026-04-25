"use client";

import React, { useRef } from "react";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  AnimatedCounter,
  MiniStatSparkline,
  StatProgressRing,
} from "./chart-components";

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  delay = 0,
  decimals = 0,
  trend,
  trendLabel,
  sparklineData,
  progress,
  live,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  delay?: number;
  decimals?: number;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  sparklineData?: number[];
  progress?: number;
  live?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!cardRef.current) return;
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 24, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          delay,
          ease: "back.out(1.4)",
        },
      );
    },
    { scope: cardRef, dependencies: [delay] },
  );

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-500 bg-emerald-500/10"
      : trend === "down"
        ? "text-red-500 bg-red-500/10"
        : "text-muted-foreground bg-muted/50";

  const textColorMap: Record<string, string> = {
    "bg-primary": "text-primary",
    "bg-emerald-500": "text-emerald-500",
    "bg-blue-500": "text-blue-500",
    "bg-amber-500": "text-amber-500",
    "bg-red-500": "text-red-500",
  };
  const textColor = textColorMap[color] ?? "text-primary";

  return (
    <div ref={cardRef}>
      <div
        className="group relative overflow-hidden rounded-2xl border border-border/40 bg-linear-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-sm transition-all duration-500 hover:border-border/80 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
        onMouseMove={(e) => {
          if (!glowRef.current) return;
          const rect = e.currentTarget.getBoundingClientRect();
          glowRef.current.style.left = `${e.clientX - rect.left}px`;
          glowRef.current.style.top = `${e.clientY - rect.top}px`;
          glowRef.current.style.opacity = "1";
        }}
        onMouseLeave={() => {
          if (glowRef.current) glowRef.current.style.opacity = "0";
        }}
      >
        <div
          ref={glowRef}
          className={cn(
            "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 size-40 rounded-full blur-3xl transition-opacity duration-500 opacity-0",
            color,
          )}
          style={{ opacity: 0 }}
        />
        <div
          className={cn(
            "absolute -right-6 -top-6 size-28 rounded-full opacity-[0.07] blur-3xl transition-all duration-700 group-hover:opacity-[0.15] group-hover:scale-125",
            color,
          )}
        />
        <div
          className={cn(
            "absolute -left-4 -bottom-4 size-20 rounded-full opacity-[0.04] blur-2xl transition-all duration-700 group-hover:opacity-[0.08]",
            color,
          )}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border/60 to-transparent" />
        <div
          className={cn(
            "absolute top-0 left-1/2 -translate-x-1/2 h-px w-0 transition-all duration-500 group-hover:w-full",
            color,
            "opacity-40",
          )}
        />

        {sparklineData && sparklineData.length > 1 && (
          <div className="absolute inset-x-0 bottom-0 h-16 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
            <MiniStatSparkline data={sparklineData} color={textColor} />
          </div>
        )}

        <div className="relative p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                {label}
              </p>
              {live && (
                <span className="relative flex size-2">
                  <span
                    className={cn(
                      "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                      color,
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex size-2 rounded-full",
                      color,
                    )}
                  />
                </span>
              )}
            </div>
            <div className="relative">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl ring-1 ring-white/10 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:rotate-3",
                  color,
                )}
              >
                <Icon className="size-4.5 text-white drop-shadow-sm" />
              </div>
              {progress != null && (
                <div className="absolute -inset-0.5">
                  <StatProgressRing
                    progress={progress}
                    color={textColor}
                    size={44}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-baseline gap-2.5">
                <AnimatedCounter
                  value={value}
                  className="text-3xl font-extrabold tabular-nums tracking-tight leading-none"
                  decimals={decimals}
                />
                {trend && trendLabel && (
                  <div
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      trendColor,
                    )}
                  >
                    <TrendIcon className="size-2.5" />
                    {trendLabel}
                  </div>
                )}
              </div>
              {subtitle && (
                <p className="text-[11px] text-muted-foreground/70 leading-tight truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
            <ArrowUpRight className="size-3.5 text-muted-foreground/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
