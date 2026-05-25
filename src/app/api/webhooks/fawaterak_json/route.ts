import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/server/db";
import { fawaterakConfig } from "@/server/services/fawaterak/config";
import { inngest } from "@/server/inngest";
import {
  activatePaidInvoice,
  invoiceAmountMatches,
} from "@/server/services/payment-workflow";

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

  if (!/^[a-f0-9]{64}$/i.test(receivedHash)) return false;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(receivedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function normalizeStatus(body: Record<string, unknown>): string | null {
  const rawStatus = body.invoice_status ?? body.status;
  if (typeof rawStatus === "string") return rawStatus.toLowerCase();
  if (typeof body.errorMessage === "string" || body.response) return "failed";
  return null;
}

function getString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
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
    const body = (await request.json()) as Record<string, unknown>;
    console.log("[Fawaterak Webhook] Received:", JSON.stringify(body));

    const invoice_id = Number(body.invoice_id);
    const invoice_key = getString(body, "invoice_key");
    const payment_method = getString(body, "payment_method");
    const status = normalizeStatus(body);

    if (!Number.isFinite(invoice_id) || !invoice_key || !payment_method || !status) {
      console.error("[Fawaterak Webhook] Malformed:", { invoice_id, invoice_key, payment_method, status });
      return NextResponse.json({ error: "Malformed webhook" }, { status: 400 });
    }

    const receivedHash =
      request.headers.get("x-fawaterak-hash") ??
      getString(body, "hashKey") ??
      "";

    // Only verify hash if one was provided
    if (receivedHash && !verifyTransactionHash(invoice_id, invoice_key, payment_method, receivedHash)) {
      console.error("[Fawaterak Webhook] Hash verification failed for invoice:", invoice_id);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Find invoice by Fawaterak ID (idempotency key)
    const invoice = await db.invoice.findFirst({
      where: { fawaterakInvoiceId: invoice_id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.fawaterakInvoiceKey !== invoice_key) {
      return NextResponse.json({ error: "Invoice mismatch" }, { status: 409 });
    }

    // Handle based on status
    switch (status) {
      case "paid": {
        // Idempotency: skip if already paid
        if (invoice.status === "PAID") {
          return NextResponse.json({ received: true });
        }

        if (
          body.amount !== undefined &&
          !invoiceAmountMatches(invoice.amount, body.amount)
        ) {
          return NextResponse.json({ error: "Amount mismatch" }, { status: 409 });
        }

        const paidCurrency = getString(body, "paidCurrency") ?? getString(body, "currency");
        if (paidCurrency && paidCurrency !== invoice.currency) {
          return NextResponse.json({ error: "Currency mismatch" }, { status: 409 });
        }

        await activatePaidInvoice(db, invoice, {
          paymentMethodUsed: payment_method,
          referenceNumber:
            getString(body, "referenceNumber") ?? getString(body, "reference_number"),
        });

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
        if (invoice.status === "FAILED" || invoice.status === "PAID") {
          return NextResponse.json({ received: true });
        }

        const errorMessage = getString(body, "errorMessage") ?? "";
        const response =
          typeof body.response === "object" && body.response !== null
            ? (body.response as Record<string, unknown>)
            : {};
        const gatewayCode = getString(response, "gatewayCode") ?? "";

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
        if (invoice.status === "FAILED" || invoice.status === "PAID") {
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
