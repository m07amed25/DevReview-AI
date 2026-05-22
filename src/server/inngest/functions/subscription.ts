import { inngest } from "../client";
import { db } from "@/server/db";
import { activatePaidInvoice } from "@/server/services/payment-workflow";

export const processPaymentSuccess = inngest.createFunction(
  {
    id: "process-payment-success",
    triggers: [{ event: "payment.paid" }],
  },
  async ({ event, step }) => {
    const { invoiceId } = event.data;

    const invoice = await step.run("fetch-invoice", async () => {
      return db.invoice.findUnique({
        where: { id: invoiceId },
        include: { user: true },
      });
    });

    if (!invoice || !invoice.planId) {
      throw new Error("Invoice or plan not found");
    }

    // Skip if already processed (idempotency)
    if (invoice.status !== "PAID") {
      return { skipped: true, reason: "Invoice not in PAID state" };
    }

    const plan = await step.run("fetch-plan", async () => {
      return db.pricingPlan.findUnique({ where: { id: invoice.planId! } });
    });

    if (!plan) {
      throw new Error("Plan not found");
    }

    // Ensure subscription state matches the paid invoice.
    await step.run("activate-subscription", async () => {
      await activatePaidInvoice(db, invoice);
      return { success: true };
    });

    // Send confirmation email (if Resend is configured)
    await step.run("send-confirmation-email", async () => {
      if (!process.env.RESEND_API_KEY) {
        return { skipped: true, reason: "RESEND_API_KEY not configured" };
      }

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.SMTP_FROM ?? "noreply@example.com",
            to: invoice.user.email,
            subject: `Payment Confirmed - ${plan.name} Plan`,
            html: `
              <h1>Payment Successful</h1>
              <p>Thank you for subscribing to the ${plan.name} plan!</p>
              <p><strong>Amount:</strong> ${invoice.amount} ${invoice.currency}</p>
              <p><strong>Plan:</strong> ${plan.name}</p>
            `,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error("Failed to send email:", error);
          return { success: false, error };
        }

        return { success: true };
      } catch (error) {
        console.error("Email error:", error);
        return { success: false, error: String(error) };
      }
    });

    return { success: true, invoiceId, planId: invoice.planId };
  }
);

export const processPaymentFailed = inngest.createFunction(
  {
    id: "process-payment-failed",
    triggers: [{ event: "payment.failed" }],
  },
  async ({ event, step }) => {
    const { invoiceId, userMessage } = event.data;

    // Log for analytics
    await step.run("log-failed-payment", async () => {
      console.log("Payment failed for invoice:", invoiceId, "Reason:", userMessage);
      return { logged: true };
    });

    return { success: true };
  }
);

export const processRefund = inngest.createFunction(
  {
    id: "process-refund",
    triggers: [{ event: "payment.refund" }],
  },
  async ({ event, step }) => {
    const { invoiceId } = event.data;

    const invoice = await step.run("fetch-invoice", async () => {
      return db.invoice.findUnique({
        where: { id: invoiceId },
        include: { user: true },
      });
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Downgrade to free plan
    await step.run("downgrade-subscription", async () => {
      return db.user.update({
        where: { id: invoice.userId },
        data: {
          planId: "free",
          planExpiresAt: null,
        },
      });
    });

    return { success: true, invoiceId };
  }
);
