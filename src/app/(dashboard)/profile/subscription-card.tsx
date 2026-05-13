"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Rocket,
  Crown,
  Calendar,
  FolderGit2,
  CheckCircle2,
  Users,
  ArrowRight,
} from "lucide-react";
import { LimitProgress } from "@/components/ui/limit-progress";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  plan: {
    id: string;
    name: string;
    tagline: string;
  };
  limits: {
    reposLimit: number | null;
    reviewsLimit: number | null;
    seatsLimit: number | null;
  };
  stats: {
    repositories: number;
    reviews: number;
    teamMembers: number;
  };
  planExpiresAt?: Date | string | null;
}

export function SubscriptionCard({
  plan,
  limits,
  stats,
  planExpiresAt,
}: SubscriptionCardProps) {
  const isFree = plan.id === "free";
  const isUltra = plan.id === "ultra";

  return (
    <Card className="overflow-hidden border-none shadow-2xl bg-neutral-900/40 backdrop-blur-2xl relative group h-full">
      {/* Dynamic Animated Background */}
      <div
        className={cn(
          "absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-30",
          isFree
            ? "bg-linear-to-br from-neutral-600 to-transparent"
            : isUltra
              ? "bg-linear-to-br from-violet-600 via-fuchsia-600 to-transparent"
              : "bg-linear-to-br from-indigo-600 to-transparent",
        )}
      />
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <CardHeader className="relative pb-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Badge className={cn(
              "border-none text-[10px] font-semibold uppercase tracking-[0.2em] px-2 py-0.5",
              isUltra ? "bg-violet-500 text-white" : "bg-indigo-500 text-white"
            )}>
              Current Plan
            </Badge>
            <CardTitle className="text-3xl font-semibold tracking-tighter text-white uppercase sm:text-4xl">
              {plan.name}
            </CardTitle>
            <CardDescription className="text-neutral-400 font-medium text-sm tracking-wide">
              {plan.tagline}
            </CardDescription>
          </div>
          <Link href="/billing">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 font-semibold text-[10px] uppercase tracking-widest px-4"
              >
                Billing
              </Button>
            </motion.div>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-8 pt-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <LimitProgress
              label="Repositories"
              usage={stats.repositories}
              limit={limits.reposLimit}
              color={isUltra ? "bg-violet-500" : "bg-indigo-500"}
              icon={<FolderGit2 className="size-4" />}
              className="bg-black/20 border-white/5"
            />
            <LimitProgress
              label="AI Reviews"
              usage={stats.reviews}
              limit={limits.reviewsLimit}
              color={isUltra ? "bg-fuchsia-500" : "bg-violet-500"}
              icon={<CheckCircle2 className="size-4" />}
              className="bg-black/20 border-white/5"
            />
            <LimitProgress
              label="Team Seats"
              usage={stats.teamMembers}
              limit={limits.seatsLimit}
              color="bg-emerald-500"
              icon={<Users className="size-4" />}
              className="bg-black/20 border-white/5"
            />
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
            {planExpiresAt ? (
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Calendar className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Next Billing</p>
                  <p className="text-xs font-semibold text-neutral-200">
                    {new Date(planExpiresAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Rocket className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Status</p>
                  <p className="text-xs font-semibold text-neutral-200">Lifetime Access</p>
                </div>
              </div>
            )}

            {isFree && (
              <Link href="/billing" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] uppercase tracking-[0.2em] px-8 shadow-xl shadow-indigo-500/20">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
