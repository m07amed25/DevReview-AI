import crypto from "crypto";
import type { PricingPlan, PrismaClient } from "@/server/db/client";

export type BillingCycle = "monthly" | "yearly";

type InvoiceForActivation = {
  id: string;
  userId: string;
  planId: string | null;
  description: string | null;
  paidAt: Date | string | null;
};

type ActivateInvoiceOptions = {
  paidAt?: Date;
  paymentMethodUsed?: string | null;
  referenceNumber?: string | null;
};

export const checkoutCurrency = "USD";

export function toAmountString(amount: number) {
  return amount.toFixed(2);
}

export function timingSafeStringEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function getInvoiceDurationMonths(description?: string | null) {
  return /\byearly\b/i.test(description ?? "") ? 12 : 1;
}

export function invoiceAmountMatches(invoiceAmount: number, received: unknown) {
  const amount = typeof received === "number" ? received : Number(received);
  return Number.isFinite(amount) && Math.abs(amount - invoiceAmount) < 0.01;
}

function toValidDate(value: Date | string | null | undefined) {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export async function calculateCheckoutAmount(
  db: PrismaClient,
  userId: string,
  plan: PricingPlan,
  billingCycle: BillingCycle,
) {
  const settings = await db.pricingSettings.findUnique({
    where: { id: "global" },
  });
  const annualDiscount =
    Math.min(Math.max(settings?.annualDiscount ?? 20, 0), 80) / 100;
  const basePrice =
    billingCycle === "monthly"
      ? plan.monthlyPrice
      : Math.round(plan.monthlyPrice * 12 * (1 - annualDiscount));

  const appliedPromos = await db.userDiscount.findMany({
    where: { userId },
    orderBy: { appliedAt: "desc" },
    take: 10,
  });

  const discounts = await db.discount.findMany({
    where: {
      id: { in: appliedPromos.map((promo) => promo.discountId) },
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      AND: [{ OR: [{ planId: null }, { planId: plan.id }] }],
    },
  });

  const discountsById = new Map(discounts.map((discount) => [discount.id, discount]));
  const discount = appliedPromos
    .map((promo) => discountsById.get(promo.discountId))
    .find((candidate) => {
      if (!candidate) return false;
      return !candidate.maxUses || candidate.usedCount <= candidate.maxUses;
    });

  if (!discount) {
    return { basePrice, finalAmount: Math.max(0, basePrice), discountId: null };
  }

  const finalAmount =
    discount.type === "PERCENTAGE"
      ? Math.round(basePrice * (1 - Math.min(Math.max(discount.value, 0), 100) / 100))
      : Math.max(0, Math.round(basePrice - Math.max(discount.value, 0)));

  return {
    basePrice,
    finalAmount: Math.max(0, finalAmount),
    discountId: discount.id,
  };
}

export async function activatePaidInvoice(
  db: PrismaClient,
  invoice: InvoiceForActivation,
  options: ActivateInvoiceOptions = {},
) {
  const planId = invoice.planId;
  if (!planId) return;

  const paidAt =
    toValidDate(options.paidAt) ?? toValidDate(invoice.paidAt) ?? new Date();
  const planExpiresAt = new Date(paidAt);
  planExpiresAt.setMonth(
    planExpiresAt.getMonth() + getInvoiceDurationMonths(invoice.description),
  );

  await db.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paidAt,
        successToken: null,
        paymentMethodUsed: options.paymentMethodUsed ?? undefined,
        referenceNumber: options.referenceNumber ?? undefined,
      },
    });

    await tx.user.update({
      where: { id: invoice.userId },
      data: { planId, planExpiresAt },
    });
  });
}
