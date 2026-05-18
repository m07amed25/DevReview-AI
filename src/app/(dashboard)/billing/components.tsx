"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  Zap,
  Shield,
  Loader2,
  Gift,
  Sparkles,
} from "lucide-react";

interface UserPlan {
  name: string;
  tagline: string;
  monthlyPrice: number;
  features: string[];
}

interface UserStats {
  reviews: number;
  repositories: number;
  teamMembers: number;
}

interface UserLimits {
  reviewsLimit: number | null;
  reposLimit: number | null;
  seatsLimit: number | null;
}

export function OverviewTab({
  plan,
  stats,
  limits,
  isUpgrading,
  handleUpgrade,
  promoCode,
  setPromoCode,
  applyingPromo,
  handleApplyPromo,
  promoMessage,
}: {
  plan: UserPlan;
  stats: UserStats;
  limits: UserLimits;
  isUpgrading: boolean;
  handleUpgrade: () => void;
  promoCode: string;
  setPromoCode: (v: string) => void;
  applyingPromo: boolean;
  handleApplyPromo: () => void;
  promoMessage: { type: "success" | "error"; text: string } | null;
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="lg:col-span-1">
          <Card className="h-full border-border/50 bg-background/40 backdrop-blur-xl shadow-xs overflow-hidden relative group">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">Current Plan</CardTitle>
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{plan.name}</Badge>
              </div>
              <CardDescription>{plan.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">${plan.monthlyPrice}</span>
                <span className="text-muted-foreground font-medium">/month</span>
              </div>
              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-6 border-t border-border/50">
              <Button onClick={handleUpgrade} disabled={isUpgrading} className="w-full relative overflow-hidden group/btn bg-foreground text-background hover:bg-foreground/90">
                <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-linear-to-b from-transparent via-transparent to-black" />
                {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" /> : <Sparkles className="mr-2 h-4 w-4 relative z-10 group-hover/btn:text-yellow-400 transition-colors" />}
                <span className="relative z-10">{isUpgrading ? "Connecting..." : "Upgrade Plan"}</span>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Resource Usage Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="lg:col-span-2">
          <Card className="h-full border-border/50 bg-background/40 backdrop-blur-xl shadow-xs">
            <CardHeader>
              <CardTitle className="text-xl">Resource Usage</CardTitle>
              <CardDescription>Your current usage for this billing cycle. Resets on {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <UsageBar icon={<Zap className="h-4 w-4 text-indigo-500" />} label="AI Code Reviews" used={stats.reviews} limit={limits.reviewsLimit} gradient="from-indigo-500 to-purple-500" />
              <UsageBar icon={<Shield className="h-4 w-4 text-emerald-500" />} label="Private Repositories" used={stats.repositories} limit={limits.reposLimit} gradient="from-emerald-400 to-emerald-600" />
              <UsageBar icon={<CreditCard className="h-4 w-4 text-blue-500" />} label="Team Members" used={stats.teamMembers} limit={limits.seatsLimit} gradient="from-blue-400 to-blue-600" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Promo Code */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
        <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-xs overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Gift className="h-5 w-5 text-pink-500" />Redeem Promo Code</CardTitle>
            <CardDescription>Have a promotional code? Enter it below to apply a discount to your next bill.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Input placeholder="e.g. AWARDS" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="pl-4 h-11 bg-background/50 border-border/60 focus-visible:ring-pink-500/30" />
              </div>
              <Button onClick={handleApplyPromo} disabled={applyingPromo || !promoCode} className="h-11 px-8 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200">
                {applyingPromo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {applyingPromo ? "Applying..." : "Apply Code"}
              </Button>
            </div>
            <AnimatePresence>
              {promoMessage && (
                <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 12 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className={`text-sm flex items-center gap-2 ${promoMessage.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
                  {promoMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {promoMessage.text}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function UsageBar({ icon, label, used, limit, gradient }: { icon: React.ReactNode; label: string; used: number; limit: number | null; gradient: string }) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 font-medium">{icon}{label}</div>
        <span className="text-muted-foreground"><span className="text-foreground font-semibold">{used}</span> / {limit ?? "∞"}</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full bg-linear-to-r ${gradient} transition-all duration-1000 ease-in-out`} style={{ width: `${pct}%` }} />
      </div>
      {limit && pct >= 80 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" />You are approaching your monthly limit.</p>
      )}
    </div>
  );
}

export function PaymentTab({ isAddingPayment, handleAddPayment }: { isAddingPayment: boolean; handleAddPayment: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Payment Methods</CardTitle>
            <CardDescription>Manage your saved credit cards and billing information.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddPayment} disabled={isAddingPayment} className="hidden sm:flex border-border/60">
            {isAddingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add Method
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 relative overflow-hidden group transition-colors hover:border-primary/30">
            <div className="absolute inset-y-0 left-0 w-1 bg-primary/80" />
            <div className="flex items-center gap-4 pl-2">
              <div className="h-10 w-16 bg-card rounded-md flex items-center justify-center border border-border shadow-xs">
                <svg viewBox="0 0 32 32" className="h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.649 20.354L13.791 6.84H17.202L15.06 20.354H11.649ZM23.013 6.963C22.253 6.657 21.196 6.381 19.866 6.381C16.518 6.381 14.225 8.156 14.208 10.638C14.191 12.46 15.845 13.483 17.135 14.111C18.459 14.757 18.903 15.163 18.894 15.789C18.884 16.742 17.747 17.159 16.48 17.159C14.935 17.159 14.004 16.745 13.253 16.398L12.723 16.147L12.261 19.049C13.064 19.421 14.545 19.742 16.088 19.759C19.646 19.759 21.905 17.994 21.93 15.42C21.95 13.979 21.054 12.879 17.306 11.082C16.155 10.518 15.412 10.155 15.42 9.539C15.42 8.956 16.059 8.347 17.433 8.347C18.665 8.33 19.605 8.608 20.339 8.946L20.672 9.102L23.013 6.963ZM31.139 20.354H28.435C27.643 20.354 27.027 19.929 26.704 19.186L22.793 9.421C22.618 8.988 22.518 8.75 22.199 8.75H17.653L17.558 9.196C18.579 9.613 20.187 10.428 21.144 11.517L24.16 20.354H27.604L31.139 20.354ZM10.22 20.354H6.844L4.475 8.286C4.331 7.625 4.148 7.375 3.639 7.125C2.607 6.621 1.077 6.278 0 6.104L0.091 5.666H7.135C7.925 5.666 8.653 6.182 8.847 7.037L10.22 20.354Z" fill="#1434CB" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-sm flex items-center gap-2">
                  Visa ending in 4242
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-primary/20 bg-primary/5 text-primary">Default</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Expires 12/2028</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">Edit</Button>
          </div>
          <Button variant="outline" className="w-full sm:hidden border-dashed border-border/60 mt-4" onClick={handleAddPayment} disabled={isAddingPayment}>
            {isAddingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add Payment Method
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function HistoryTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-xs">
        <CardHeader>
          <CardTitle className="text-xl">Billing History</CardTitle>
          <CardDescription>View and download your past invoices and receipts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: "INV-2026-003", status: "Paid", date: "May 1, 2026", amount: "$0.00" },
                  { id: "INV-2026-002", status: "Paid", date: "Apr 1, 2026", amount: "$0.00" },
                  { id: "INV-2026-001", status: "Paid", date: "Mar 1, 2026", amount: "$0.00" },
                ].map((invoice) => (
                  <TableRow key={invoice.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-xs">{invoice.id}</TableCell>
                    <TableCell><Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-normal">{invoice.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{invoice.date}</TableCell>
                    <TableCell className="text-sm">{invoice.amount}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="h-4 w-4 text-muted-foreground" /><span className="sr-only">Download</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
