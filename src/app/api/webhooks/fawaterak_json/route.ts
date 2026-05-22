import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/server/db";
import { fawaterakConfig } from "@/server/services/fawaterak/config";
import { inngest } from "@/server/inngest";

function verifyTransactionHash(
  invoiceId: number,
  invoiceKey: string,
  paymentMethod: string,
  receivedHash: string
): boolean {
  const queryParam = `InvoiceId=${invoiceId}&InvoiceKey=${invoiceKey}&PaymentMethod=${paymentMethod}`;
  const expected = crypto
    .createHmac("sha256", fawaterakConfig.vendorKey)
    .update(queryParam)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(receivedHash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getUserFacingError(errorMessage: string, gatewayCode: string): string {
  if (errorMessage.includes("3D Secure authentication failed")) {
    return "Card authentication failed. Please try again or use a different card.";
  }
  if (errorMessage.includes("cancelled")) {
    return "Payment was cancelled. You can try again when ready.";
  }
  if (gatewayCode === "DECLINED") {
    return "Your card was declined. Please try a different card or contact your bank.";
  }
  return "Payment could not be processed. Please try again or use a different payment method.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice_id, invoice_key, payment_method, status } = body;

    // Verify hash from header
    const receivedHash = request.headers.get("x-fawaterak-hash") ?? "";
    if (!verifyTransactionHash(invoice_id, invoice_key, payment_method, receivedHash)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Find invoice by Fawaterak ID (idempotency key)
    const invoice = await db.invoice.findFirst({
      where: { fawaterakInvoiceId: invoice_id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Handle based on status
    switch (status) {
      case "paid": {
        // Idempotency: skip if already paid
        if (invoice.status === "PAID") {
          return NextResponse.json({ received: true });
        }

        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            paymentMethodUsed: payment_method,
            referenceNumber: body.reference_number,
          },
        });

        // Activate subscription immediately
        if (invoice.planId) {
          const planExpiresAt = new Date();
          planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);
          await db.user.update({
            where: { id: invoice.userId },
            data: { planId: invoice.planId, planExpiresAt },
          });
        }

        // Also send to Inngest for email notification (best-effort)
        try {
          await inngest.send({
            name: "payment.paid",
            data: { invoiceId: invoice.id },
          });
        } catch {}

        break;
      }

      case "failed": {
        if (invoice.status === "FAILED") {
          return NextResponse.json({ received: true });
        }

        const errorMessage = body.errorMessage ?? "";
        const gatewayCode = body.response?.gatewayCode ?? "";

        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "FAILED",
            paymentMethodUsed: payment_method,
          },
        });

        // Offload to Inngest - notify user
        await inngest.send({
          name: "payment.failed",
          data: {
            invoiceId: invoice.id,
            userMessage: getUserFacingError(errorMessage, gatewayCode),
          },
        });

        break;
      }

      case "expired": {
        if (invoice.status === "FAILED") {
          return NextResponse.json({ received: true });
        }

        await db.invoice.update({
          where: { id: invoice.id },
          data: { status: "FAILED" },
        });

        break;
      }

      case "refund": {
        if (invoice.status === "REFUNDED") {
          return NextResponse.json({ received: true });
        }

        await db.invoice.update({
          where: { id: invoice.id },
          data: { status: "REFUNDED" },
        });

        // Offload subscription downgrade to Inngest
        await inngest.send({
          name: "payment.refund",
          data: { invoiceId: invoice.id },
        });

        break;
      }

      default:
        console.warn("Unknown webhook status:", status);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Fawaterak webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
