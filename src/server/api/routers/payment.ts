import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { payments, tokenization } from "../../services/fawaterak";
import { fawaterakConfig } from "../../services/fawaterak/config";

// Prices are stored in whole EGP — convert to string for Fawaterak
const toAmountStr = (amount: number) => amount.toFixed(2);

export const paymentRouter = createTRPCRouter({
  getPaymentMethods: protectedProcedure.query(async () => {
    try {
      const methods = await payments.getPaymentMethods();
      return methods;
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      return [];
    }
  }),

  initiatePayment: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        billingCycle: z.enum(["monthly", "yearly"]),
        paymentMethodId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const billing = await ctx.db.billingInfo.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!billing) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Please add billing information first.",
        });
      }

      const plan = await ctx.db.pricingPlan.findUnique({
        where: { id: input.planId },
      });
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      const amountCents =
        input.billingCycle === "monthly" ? plan.monthlyPrice : Math.round(plan.monthlyPrice * 12 * 0.8);
      const amountMajor = toAmountStr(amountCents);

      const invoice = await ctx.db.invoice.create({
        data: {
          userId: ctx.user.id,
          amount: amountCents,
          planId: input.planId,
          description: `${plan.name} - ${input.billingCycle}`,
          currency: "EGP",
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      try {
        const result = await payments.executePayment({
          payment_method_id: input.paymentMethodId,
          cartTotal: amountMajor,
          currency: "EGP",
          customer: {
            first_name: billing.fullName.split(" ")[0] ?? billing.fullName,
            last_name: billing.fullName.split(" ").slice(1).join(" ") || "User",
            email: billing.email,
            address: billing.address ?? undefined,
            customer_unique_id: ctx.user.id,
          },
          cartItems: [{ name: plan.name, price: amountMajor, quantity: "1" }],
          redirectionUrls: {
            successUrl: `${baseUrl}/billing/success?invoice=${invoice.id}`,
            failUrl: `${baseUrl}/billing/failed?invoice=${invoice.id}`,
            pendingUrl: `${baseUrl}/billing/pending?invoice=${invoice.id}`,
            webhookUrl: `${baseUrl}/api/webhooks/fawaterak`,
          },
          invoice_number: invoice.id,
        });

        await ctx.db.invoice.update({
          where: { id: invoice.id },
          data: {
            fawaterakInvoiceId: result.invoice_id,
            fawaterakInvoiceKey: result.invoice_key,
          },
        });

        return {
          invoiceId: invoice.id,
          fawaterakInvoiceId: result.invoice_id,
          fawaterakInvoiceKey: result.invoice_key,
          redirectTo: result.payment_data.redirectTo,
          referenceCode:
            result.payment_data.fawryCode ??
            result.payment_data.amanCode ??
            result.payment_data.masaryCode ??
            result.payment_data.meezaReference?.toString(),
        };
      } catch (error) {
        await ctx.db.invoice.update({
          where: { id: invoice.id },
          data: { status: "FAILED" },
        });
        throw error;
      }
    }),

  getPaymentStatus: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findFirst({
        where: { id: input.invoiceId, userId: ctx.user.id },
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

      if (!invoice.fawaterakInvoiceId) {
        return { status: invoice.status, invoice };
      }

      const txData = await payments.getTransactionData(invoice.fawaterakInvoiceId);
      return { status: txData.invoice_status, invoice, txData };
    }),

  saveCardScreen: protectedProcedure.mutation(async ({ ctx }) => {
    const billing = await ctx.db.billingInfo.findUnique({
      where: { userId: ctx.user.id },
    });
    if (!billing) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Please add billing information first.",
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const result = await tokenization.createCardTokenScreen({
      customer_unique_id: ctx.user.id,
      customer: {
        first_name: billing.fullName.split(" ")[0] ?? billing.fullName,
        last_name: billing.fullName.split(" ").slice(1).join(" ") || "User",
        email: billing.email,
      },
      redirect_url: `${baseUrl}/billing/cards/saved`,
    });

    return { url: result.card_token_screen_url, cardTokenUniqueId: result.card_token_unique_id };
  }),

  payWithSavedCard: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        billingCycle: z.enum(["monthly", "yearly"]),
        cardId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const billing = await ctx.db.billingInfo.findUnique({
        where: { userId: ctx.user.id },
        include: { paymentMethods: true },
      });
      if (!billing) throw new TRPCError({ code: "NOT_FOUND" });

      const card = billing.paymentMethods.find((c) => c.id === input.cardId);
      if (!card || !card.fawaterakToken) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Card not found or not tokenized" });
      }

      const plan = await ctx.db.pricingPlan.findUnique({ where: { id: input.planId } });
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      const amountCents =
        input.billingCycle === "monthly" ? plan.monthlyPrice : Math.round(plan.monthlyPrice * 12 * 0.8);
      const amountMajor = toAmountStr(amountCents);

      const invoice = await ctx.db.invoice.create({
        data: {
          userId: ctx.user.id,
          amount: amountCents,
          planId: input.planId,
          description: `${plan.name} - ${input.billingCycle}`,
          currency: "EGP",
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const result = await tokenization.payWithToken({
        cartTotal: amountMajor,
        currency: "EGP",
        customer: {
          first_name: billing.fullName.split(" ")[0] ?? billing.fullName,
          last_name: billing.fullName.split(" ").slice(1).join(" ") || "User",
          email: billing.email,
          customer_unique_id: ctx.user.id,
        },
        cartItems: [{ name: plan.name, price: amountMajor, quantity: "1" }],
        redirectionUrls: {
          webhookUrl: `${baseUrl}/api/webhooks/fawaterak`,
        },
        card_token: card.fawaterakToken,
        invoice_number: invoice.id,
      });

      await ctx.db.invoice.update({
        where: { id: invoice.id },
        data: {
          fawaterakInvoiceId: result.invoice_id,
          fawaterakInvoiceKey: result.invoice_key,
          paymentMethodUsed: card.cardBrand,
        },
      });

      return { invoiceId: invoice.id, transactionId: result.transaction_id };
    }),

  removeSavedCard: protectedProcedure
    .input(z.object({ cardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const billing = await ctx.db.billingInfo.findUnique({
        where: { userId: ctx.user.id },
        include: { paymentMethods: true },
      });
      if (!billing) throw new TRPCError({ code: "NOT_FOUND" });

      const card = billing.paymentMethods.find((c) => c.id === input.cardId);
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });

      if (card.customerUniqueId && card.cardTokenUniqueId) {
        await tokenization.deleteCustomerToken(card.customerUniqueId, card.cardTokenUniqueId);
      }

      await ctx.db.paymentMethod.delete({ where: { id: input.cardId } });

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

  getSavedCards: protectedProcedure.query(async ({ ctx }) => {
    const billing = await ctx.db.billingInfo.findUnique({
      where: { userId: ctx.user.id },
      include: {
        paymentMethods: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    });
    return billing?.paymentMethods ?? [];
  }),
});
