"use client";

import { useState, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Trash2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Checkbox } from "@/components/ui/checkbox";
import { COUNTRIES, SUBDIVISIONS, getSubdivisionLabel } from "@/lib/billing-data";

// ─── Overview Tab (unchanged from original) ─────────────────────────────────

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
  discount,
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
  discount: { type: "PERCENTAGE" | "FIXED"; value: number } | null;
}) {
  const discountedPrice = discount
    ? discount.type === "PERCENTAGE"
      ? Math.round(plan.monthlyPrice * (1 - discount.value / 100))
      : Math.max(0, plan.monthlyPrice - discount.value)
    : null;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              <div className="flex items-baseline gap-2">
                {discountedPrice !== null ? (
                  <>
                    <span className="text-4xl font-bold tracking-tight text-emerald-500">${discountedPrice}</span>
                    <span className="text-xl text-muted-foreground line-through">${plan.monthlyPrice}</span>
                    <span className="text-muted-foreground font-medium">/month</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold tracking-tight">${plan.monthlyPrice}</span>
                    <span className="text-muted-foreground font-medium">/month</span>
                  </>
                )}
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
              {plan.monthlyPrice === 0 ? (
                <Button onClick={handleUpgrade} disabled={isUpgrading} className="w-full relative overflow-hidden group/btn bg-foreground text-background hover:bg-foreground/90">
                  <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-linear-to-b from-transparent via-transparent to-black" />
                  {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" /> : <Sparkles className="mr-2 h-4 w-4 relative z-10 group-hover/btn:text-yellow-400 transition-colors" />}
                  <span className="relative z-10">{isUpgrading ? "Connecting..." : "Upgrade Plan"}</span>
                </Button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-2 text-sm text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">You&apos;re on the {plan.name} plan</span>
                </div>
              )}
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resource Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageBar icon={<Zap className="h-3.5 w-3.5 text-indigo-500" />} label="AI Code Reviews" used={stats.reviews} limit={limits.reviewsLimit} gradient="from-indigo-500 to-purple-500" />
              <UsageBar icon={<Shield className="h-3.5 w-3.5 text-emerald-500" />} label="Repositories" used={stats.repositories} limit={limits.reposLimit} gradient="from-emerald-400 to-emerald-600" />
              <UsageBar icon={<CreditCard className="h-3.5 w-3.5 text-blue-500" />} label="Team Members" used={stats.teamMembers} limit={limits.seatsLimit} gradient="from-blue-400 to-blue-600" />
            </CardContent>
          </Card>

          <Card className="flex-1 border-border/50 bg-background/40 backdrop-blur-xl shadow-xs overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Gift className="h-4 w-4 text-pink-500" />Promo Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input placeholder="Enter code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="flex-1 h-9 bg-background/50 border-border/60 focus-visible:ring-pink-500/30 text-sm" />
                <Button onClick={handleApplyPromo} disabled={applyingPromo || !promoCode} size="sm" className="h-9 px-5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200">
                  {applyingPromo && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  {applyingPromo ? "Applying..." : "Apply"}
                </Button>
              </div>
              <AnimatePresence>
                {promoMessage && (
                  <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 8 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className={`text-xs flex items-center gap-1.5 ${promoMessage.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
                    {promoMessage.type === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    {promoMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>
              <AppliedPromos />
            </CardContent>
          </Card>
        </motion.div>
      </div>
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

function AppliedPromos() {
  const { data: promos } = trpc.billing.getAppliedPromos.useQuery();
  if (!promos || promos.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Applied Discounts</p>
      {promos.map((p) => (
        <div key={p.code} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Gift className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{p.code}</p>
              <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-500">
                {p.type === "PERCENTAGE" ? `${p.value}% off` : `$${p.value} off`}
              </Badge>
            </div>
            {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
          </div>
          <p className="text-[10px] text-muted-foreground shrink-0">
            {new Date(p.appliedAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Payment Tab (real data) ─────────────────────────────────────────────────

export function PaymentTab() {
  const utils = trpc.useUtils();
  const { data: billing, isLoading } = trpc.billing.getInfo.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);

  const setDefault = trpc.billing.setDefaultCard.useMutation({
    onSuccess: () => {
      utils.billing.getInfo.invalidate();
      toast.success("Default card updated");
    },
  });

  const removeCard = trpc.billing.removeCard.useMutation({
    onSuccess: () => {
      utils.billing.getInfo.invalidate();
      toast.success("Card removed");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Billing Info Card */}
      <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Billing Information</CardTitle>
            <CardDescription>Your billing name and address for invoices.</CardDescription>
          </div>
          <Dialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">{billing ? "Edit" : "Add"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Billing Information</DialogTitle>
                <DialogDescription>This information appears on your invoices.</DialogDescription>
              </DialogHeader>
              <BillingInfoForm
                initial={billing ?? undefined}
                onSuccess={() => setBillingDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        {billing && (
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{billing.fullName}</p>
            <p className="text-muted-foreground">{billing.email}</p>
            {billing.address && <p className="text-muted-foreground">{billing.address}</p>}
            {(billing.city || billing.state || billing.zip) && (
              <p className="text-muted-foreground">
                {[billing.city, billing.state, billing.zip].filter(Boolean).join(", ")}
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Payment Methods Card */}
      <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Payment Methods</CardTitle>
            <CardDescription>Manage your saved cards.</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={!billing}>
                <Plus className="mr-2 h-4 w-4" />Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>Card numbers are never stored. Only the last 4 digits are saved.</DialogDescription>
              </DialogHeader>
              <AddCardForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {!billing && (
            <p className="text-sm text-muted-foreground">Add billing information first to manage cards.</p>
          )}
          {billing?.paymentMethods.length === 0 && (
            <p className="text-sm text-muted-foreground">No payment methods on file.</p>
          )}
          {billing?.paymentMethods.map((card) => (
            <div key={card.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 relative overflow-hidden group transition-colors hover:border-primary/30">
              {card.isDefault && <div className="absolute inset-y-0 left-0 w-1 bg-primary/80" />}
              <div className="flex items-center gap-4 pl-2">
                <div className="h-10 w-16 bg-card rounded-md flex items-center justify-center border border-border shadow-xs">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {card.cardBrand} ending in {card.lastFour}
                    {card.isDefault && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-primary/20 bg-primary/5 text-primary">Default</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Expires {String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!card.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={setDefault.isPending}
                    onClick={() => setDefault.mutate({ cardId: card.id })}
                    title="Set as default"
                  >
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive"
                  disabled={removeCard.isPending}
                  onClick={() => removeCard.mutate({ cardId: card.id })}
                  title="Remove card"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function luhnCheck(num: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i]!, 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  // Amex: 4-6-5, others: 4-4-4-4
  if (/^3[47]/.test(digits)) {
    return digits.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" ")
    );
  }
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function detectBrand(num: string): "visa" | "mastercard" | "amex" | "discover" | null {
  const d = num.replace(/\s/g, "");
  if (/^4/.test(d)) return "visa";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  if (/^6(?:011|5)/.test(d)) return "discover";
  return null;
}

// ─── Billing Info Form ───────────────────────────────────────────────────────

function BillingInfoForm({
  initial,
  onSuccess,
}: {
  initial?: { fullName: string; email: string; address?: string | null; city?: string | null; state?: string | null; zip?: string | null; country: string };
  onSuccess: () => void;
}) {
  const utils = trpc.useUtils();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [country, setCountry] = useState(initial?.country ?? "US");

  const subdivisions = SUBDIVISIONS[country];
  const subdivisionLabel = getSubdivisionLabel(country);

  const upsert = trpc.billing.upsertInfo.useMutation({
    onSuccess: () => {
      utils.billing.getInfo.invalidate();
      toast.success("Billing information saved");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const validate = (fd: FormData): boolean => {
    const errs: Record<string, string> = {};
    const fullName = (fd.get("fullName") as string).trim();
    const email = (fd.get("email") as string).trim();
    const zip = (fd.get("zip") as string).trim();

    if (!fullName || fullName.length < 2) errs.fullName = "Name must be at least 2 characters";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    if (zip && !/^[\w\s-]{2,20}$/.test(zip)) errs.zip = "Enter a valid postal code";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!validate(fd)) return;

    upsert.mutate({
      fullName: (fd.get("fullName") as string).trim(),
      email: (fd.get("email") as string).trim(),
      address: (fd.get("address") as string).trim() || undefined,
      city: (fd.get("city") as string).trim() || undefined,
      state: (fd.get("state") as string).trim() || undefined,
      zip: (fd.get("zip") as string).trim() || undefined,
      country: (fd.get("country") as string) || "US",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="fullName" className="text-sm font-medium">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="fullName"
              name="fullName"
              required
              defaultValue={initial?.fullName}
              placeholder="John Doe"
              className={errors.fullName ? "border-destructive focus-visible:ring-destructive/30" : ""}
              onChange={() => errors.fullName && setErrors((p) => ({ ...p, fullName: "" }))}
              autoComplete="name"
            />
          </div>
          {errors.fullName && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.fullName}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            Billing Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={initial?.email}
            placeholder="billing@company.com"
            className={errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}
            onChange={() => errors.email && setErrors((p) => ({ ...p, email: "" }))}
            autoComplete="email"
          />
          {errors.email && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="address" className="text-sm font-medium">Street Address</Label>
          <Input id="address" name="address" defaultValue={initial?.address ?? ""} placeholder="123 Main St, Apt 4" autoComplete="street-address" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-sm font-medium">City</Label>
          <Input id="city" name="city" defaultValue={initial?.city ?? ""} placeholder="San Francisco" autoComplete="address-level2" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state" className="text-sm font-medium">{subdivisionLabel}</Label>
          {subdivisions ? (
            <select
              id="state"
              name="state"
              defaultValue={initial?.state ?? ""}
              className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
              autoComplete="address-level1"
            >
              <option value="">Select...</option>
              {subdivisions.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          ) : (
            <Input id="state" name="state" defaultValue={initial?.state ?? ""} placeholder="State / Province" autoComplete="address-level1" />
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zip" className="text-sm font-medium">ZIP / Postal Code</Label>
          <Input
            id="zip"
            name="zip"
            defaultValue={initial?.zip ?? ""}
            placeholder="94102"
            className={errors.zip ? "border-destructive focus-visible:ring-destructive/30" : ""}
            onChange={() => errors.zip && setErrors((p) => ({ ...p, zip: "" }))}
            autoComplete="postal-code"
          />
          {errors.zip && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.zip}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-sm font-medium">Country</Label>
          <select
            id="country"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
            autoComplete="country"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <Shield className="h-4 w-4 text-blue-500 shrink-0" />
        <span>This information is used for invoicing and tax purposes only.</span>
      </div>

      <Button type="submit" className="w-full h-10" disabled={upsert.isPending}>
        {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initial ? "Update Billing Info" : "Save Billing Info"}
      </Button>
    </form>
  );
}

// ─── Add Card Form ───────────────────────────────────────────────────────────

function AddCardForm({ onSuccess }: { onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [cvvFocused, setCvvFocused] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const brand = detectBrand(cardNumber);
  const rawDigits = cardNumber.replace(/\s/g, "");
  const isValidLength = brand === "amex" ? rawDigits.length === 15 : rawDigits.length === 16;
  const isValidLuhn = isValidLength && luhnCheck(rawDigits);
  const cvvLength = brand === "amex" ? 4 : 3;

  const addCard = trpc.billing.addCard.useMutation({
    onSuccess: () => {
      utils.billing.getInfo.invalidate();
      toast.success("Card added securely");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!isValidLength) errs.cardNumber = "Enter a complete card number";
    else if (!isValidLuhn) errs.cardNumber = "Invalid card number";

    const [m, y] = expiry.split("/");
    if (!m || !y || m.length !== 2 || y.length !== 2) {
      errs.expiry = "Use MM/YY format";
    } else {
      const month = parseInt(m, 10);
      const year = 2000 + parseInt(y, 10);
      const now = new Date();
      if (month < 1 || month > 12) errs.expiry = "Invalid month";
      else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
        errs.expiry = "Card has expired";
      }
    }

    if (cvv.length < cvvLength) errs.cvv = `Must be ${cvvLength} digits`;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    const [m, y] = expiry.split("/");
    addCard.mutate({
      cardNumber: rawDigits,
      expiryMonth: parseInt(m!, 10),
      expiryYear: 2000 + parseInt(y!, 10),
      isDefault,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 3D Flip Card Preview */}
      <div className="perspective-[1000px] h-48 w-full">
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: cvvFocused ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Front Face */}
          <div className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-5 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] select-none backface-hidden">
            {/* Brand Icons Row */}
            <div className="absolute top-4 right-5 flex items-center gap-2">
              <span className={`text-xs font-bold tracking-wider transition-opacity duration-300 ${brand === "visa" ? "opacity-100" : brand ? "opacity-20" : "opacity-50"}`}>VISA</span>
              <span className={`flex -space-x-1.5 transition-opacity duration-300 ${brand === "mastercard" ? "opacity-100" : brand ? "opacity-20" : "opacity-50"}`}>
                <span className="h-4 w-4 rounded-full bg-red-500 inline-block" />
                <span className="h-4 w-4 rounded-full bg-yellow-500 inline-block" />
              </span>
              <span className={`text-xs font-bold tracking-wider transition-opacity duration-300 ${brand === "amex" ? "opacity-100" : brand ? "opacity-20" : "opacity-50"}`}>AMEX</span>
            </div>
            {/* Chip */}
            <div className="absolute top-5 left-5">
              <div className="h-9 w-12 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner">
                <div className="h-full w-full rounded-md border border-yellow-700/30 grid grid-cols-3 grid-rows-3 gap-px p-1 opacity-60">
                  {Array.from({ length: 9 }).map((_, i) => <div key={i} className="rounded-sm bg-yellow-800/40" />)}
                </div>
              </div>
            </div>
            {/* Contactless */}
            <div className="absolute top-7 left-[4.5rem]">
              <svg className="h-5 w-5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A5 5 0 0112 13a5 5 0 013.5 1.5M6 17a8 8 0 014-2 8 8 0 014 2M12 10a2 2 0 012 2" strokeLinecap="round"/></svg>
            </div>
            {/* Card Number */}
            <div className="absolute bottom-16 left-5 right-5">
              <p className="font-mono text-[1.15rem] tracking-[0.18em] opacity-95">
                {cardNumber || "•••• •••• •••• ••••"}
              </p>
            </div>
            {/* Bottom row */}
            <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
              <div>
                <p className="text-[9px] uppercase tracking-widest opacity-50 mb-0.5">Card Holder</p>
                <p className="text-xs uppercase tracking-wider opacity-90 font-medium">
                  {cardName || "YOUR NAME"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest opacity-50 mb-0.5">Expires</p>
                <p className="text-xs tracking-wider opacity-90 font-mono">
                  {expiry || "MM/YY"}
                </p>
              </div>
            </div>
          </div>

          {/* Back Face */}
          <div className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] select-none backface-hidden [transform:rotateY(180deg)]">
            {/* Magnetic Strip */}
            <div className="mt-6 h-11 w-full bg-zinc-950/80" />
            {/* CVV Strip */}
            <div className="mt-4 mx-5 flex items-center gap-3">
              <div className="flex-1 h-9 bg-zinc-200 rounded flex items-center justify-end px-3">
                <span className="font-mono text-zinc-900 text-sm tracking-widest">
                  {cvv || "•••"}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider opacity-60">CVV</span>
            </div>
            {/* Info text */}
            <div className="absolute bottom-5 left-5 right-5">
              <div className="h-3 w-3/4 bg-zinc-600/30 rounded mb-1.5" />
              <div className="h-3 w-1/2 bg-zinc-600/30 rounded" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Card Number */}
      <div className="space-y-1.5">
        <Label htmlFor="cardNumber" className="text-sm font-medium">
          Card Number <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => {
              const formatted = formatCardNumber(e.target.value);
              setCardNumber(formatted);
              errors.cardNumber && setErrors((p) => ({ ...p, cardNumber: "" }));
              // Auto-advance when card number is complete
              const digits = formatted.replace(/\s/g, "");
              const maxLen = /^3[47]/.test(digits) ? 15 : 16;
              if (digits.length === maxLen) expiryRef.current?.focus();
            }}
            required
            placeholder="4242 4242 4242 4242"
            maxLength={brand === "amex" ? 17 : 19}
            autoComplete="cc-number"
            inputMode="numeric"
            className={`pr-10 ${errors.cardNumber ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValidLuhn ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </motion.div>
            ) : rawDigits.length > 0 ? (
              <CreditCard className="h-4 w-4 text-muted-foreground/50" />
            ) : null}
          </div>
        </div>
        {errors.cardNumber && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.cardNumber}</p>}
      </div>

      {/* Expiry + CVV row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="expiry" className="text-sm font-medium">
            Expiry <span className="text-destructive">*</span>
          </Label>
          <Input
            ref={expiryRef}
            id="expiry"
            value={expiry}
            onChange={(e) => {
              const formatted = formatExpiry(e.target.value);
              setExpiry(formatted);
              errors.expiry && setErrors((p) => ({ ...p, expiry: "" }));
              // Auto-advance when expiry is complete (MM/YY = 5 chars)
              if (formatted.length === 5) cvvRef.current?.focus();
            }}
            required
            placeholder="MM/YY"
            maxLength={5}
            autoComplete="cc-exp"
            inputMode="numeric"
            className={errors.expiry ? "border-destructive focus-visible:ring-destructive/30" : ""}
          />
          {errors.expiry && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.expiry}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cvv" className="text-sm font-medium">
            {brand === "amex" ? "CID (4 digits, front)" : "CVV (3 digits, back)"} <span className="text-destructive">*</span>
          </Label>
          <Input
            ref={cvvRef}
            id="cvv"
            value={cvv}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, cvvLength);
              setCvv(v);
              errors.cvv && setErrors((p) => ({ ...p, cvv: "" }));
              // Auto-advance when CVV is complete
              if (v.length === cvvLength) nameRef.current?.focus();
            }}
            onFocus={() => setCvvFocused(true)}
            onBlur={() => setCvvFocused(false)}
            required
            placeholder={brand === "amex" ? "••••" : "•••"}
            maxLength={cvvLength}
            autoComplete="cc-csc"
            inputMode="numeric"
            type="password"
            className={errors.cvv ? "border-destructive focus-visible:ring-destructive/30" : ""}
          />
          {errors.cvv && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.cvv}</p>}
        </div>
      </div>

      {/* Cardholder Name */}
      <div className="space-y-1.5">
        <Label htmlFor="cardName" className="text-sm font-medium">
          Name on Card
        </Label>
        <Input
          ref={nameRef}
          id="cardName"
          value={cardName}
          onChange={(e) => setCardName(e.target.value.toUpperCase())}
          placeholder="JOHN DOE"
          autoComplete="cc-name"
          className="uppercase tracking-wide"
        />
      </div>

      {/* Default checkbox */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(v === true)} />
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Set as default payment method</span>
      </label>

      {/* Security notice */}
      <div className="flex items-start gap-3 text-xs text-muted-foreground bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-lg">
        <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-emerald-600 dark:text-emerald-400">256-bit TLS Encrypted</p>
          <p>Your full card number is never stored. Only the last 4 digits are saved for identification. Transmitted securely via TLS 1.3.</p>
        </div>
      </div>

      <Button type="submit" className="w-full h-11 text-sm font-medium relative overflow-hidden group/btn" disabled={addCard.isPending}>
        <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
        <span className="relative flex items-center justify-center gap-2">
          {addCard.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Shield className="h-4 w-4" />
          )}
          {addCard.isPending ? "Encrypting & Saving..." : "Add Card Securely"}
        </span>
      </Button>
    </form>
  );
}

// ─── History Tab (static for now) ────────────────────────────────────────────

export function HistoryTab() {
  const { data: invoices, isLoading } = trpc.billing.getInvoices.useQuery();

  const statusStyles: Record<string, string> = {
    PAID: "bg-emerald-500/10 text-emerald-500",
    PENDING: "bg-yellow-500/10 text-yellow-500",
    FAILED: "bg-red-500/10 text-red-500",
    REFUNDED: "bg-blue-500/10 text-blue-500",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-xs">
        <CardHeader>
          <CardTitle className="text-xl">Billing History</CardTitle>
          <CardDescription>View your past invoices and receipts.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No billing history yet.</p>
          ) : (
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px]">Invoice</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs">{inv.id.slice(-8).toUpperCase()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inv.description || inv.planId || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`font-normal ${statusStyles[inv.status] ?? ""}`}>
                          {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-sm text-right font-medium">
                        ${(inv.amount / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
