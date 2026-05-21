import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { tokenization } from "../../services/fawaterak";

const billingInfoSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(320),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().length(2).default("US"),
});

export const billingRouter = createTRPCRouter({
  getInfo: protectedProcedure.query(async ({ ctx }) => {
    const billing = await ctx.db.billingInfo.findUnique({
      where: { userId: ctx.user.id },
      include: {
        paymentMethods: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            cardBrand: true,
            lastFour: true,
            expiryMonth: true,
            expiryYear: true,
            isDefault: true,
            createdAt: true,
          },
        },
      },
    });
    return billing;
  }),

  getInvoices: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.invoice.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, amount: true, status: true, planId: true, description: true, createdAt: true },
    });
  }),

  upsertInfo: protectedProcedure
    .input(billingInfoSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.billingInfo.upsert({
        where: { userId: ctx.user.id },
        create: { ...input, userId: ctx.user.id },
        update: input,
      });
    }),

  setDefaultCard: protectedProcedure
    .input(z.object({ cardId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const billing = await ctx.db.billingInfo.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!billing) throw new TRPCError({ code: "NOT_FOUND" });

      // Verify card belongs to user
      const card = await ctx.db.paymentMethod.findFirst({
        where: { id: input.cardId, billingInfoId: billing.id },
      });
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.paymentMethod.updateMany({
        where: { billingInfoId: billing.id },
        data: { isDefault: false },
      });
      await ctx.db.paymentMethod.update({
        where: { id: input.cardId },
        data: { isDefault: true },
      });

      return { success: true };
    }),

  removeCard: protectedProcedure
    .input(z.object({ cardId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const billing = await ctx.db.billingInfo.findUnique({
        where: { userId: ctx.user.id },
        include: { paymentMethods: true },
      });
      if (!billing) throw new TRPCError({ code: "NOT_FOUND" });

      const card = billing.paymentMethods.find((c) => c.id === input.cardId);
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });

      // Delete token from Fawaterak if it exists
      if (card.cardTokenUniqueId && card.customerUniqueId) {
        await tokenization.deleteCustomerToken(
          card.customerUniqueId,
          card.cardTokenUniqueId
        );
      }

      await ctx.db.paymentMethod.delete({ where: { id: input.cardId } });

      // If deleted card was default, promote next card
      if (card.isDefault) {
        const next = billing.paymentMethods.find((c) => c.id !== input.cardId);
        if (next) {
          await ctx.db.paymentMethod.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }

      return { success: true };
    }),

  getAppliedPromos: protectedProcedure.query(async ({ ctx }) => {
    const used = await ctx.db.userDiscount.findMany({
      where: { userId: ctx.user.id },
      orderBy: { appliedAt: "desc" },
    });
    if (used.length === 0) return [];
    const discounts = await ctx.db.discount.findMany({
      where: { id: { in: used.map((u) => u.discountId) } },
      select: { id: true, code: true, type: true, value: true, description: true },
    });
    const map = new Map(discounts.map((d) => [d.id, d]));
    return used
      .filter((u) => map.has(u.discountId))
      .map((u) => {
        const d = map.get(u.discountId)!;
        return { code: d.code, type: d.type, value: d.value, description: d.description, appliedAt: u.appliedAt };
      });
  }),


  applyPromo: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const discount = await ctx.db.discount.findUnique({
        where: { code: input.code.toUpperCase() },
      });

      if (!discount || !discount.active) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired promo code." });
      }

      if (discount.expiresAt && discount.expiresAt < new Date()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This promo code has expired." });
      }

      if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This promo code has reached its usage limit." });
      }

      // Check if user already used this code
      const alreadyUsed = await ctx.db.userDiscount.findUnique({
        where: { userId_discountId: { userId: ctx.user.id, discountId: discount.id } },
      });
      if (alreadyUsed) {
        throw new TRPCError({ code: "CONFLICT", message: "You have already used this promo code." });
      }

      // Record usage and increment count
      await ctx.db.$transaction([
        ctx.db.userDiscount.create({
          data: { userId: ctx.user.id, discountId: discount.id },
        }),
        ctx.db.discount.update({
          where: { id: discount.id },
          data: { usedCount: { increment: 1 } },
        }),
      ]);

      const label =
        discount.type === "PERCENTAGE"
          ? `${discount.value}% off`
          : `$${discount.value} off`;

      return {
        success: true,
        message: `Promo code applied! ${label} your next bill.`,
        type: discount.type,
        value: discount.value,
      };
    }),
});
