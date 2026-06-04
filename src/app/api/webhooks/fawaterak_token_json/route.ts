import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/server/db";
import { fawaterakConfig } from "@/server/services/fawaterak/config";
import {
  encryptPaymentToken,
  fingerprintPaymentToken,
} from "@/server/services/payment-tokens";

function verifyTokenizationHash(
  customerUniqueId: string,
  customerCardToken: string,
  receivedHash: string
): boolean {
  const queryParam = `customerUniqueId=${customerUniqueId}&customerCardToken=${customerCardToken}`;
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

function detectCardBrand(cardNumber: string): string {
  const first6 = cardNumber.slice(0, 6);
  if (/^4/.test(first6)) return "Visa";
  if (/^5[1-5]/.test(first6) || /^2[2-7]/.test(first6)) return "Mastercard";
  return "Card";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const customerUniqueId =
      typeof body.customerUniqueId === "string" ? body.customerUniqueId : "";
    const customerCardToken =
      typeof body.customerCardToken === "string" ? body.customerCardToken : "";
    const customerCard =
      typeof body.customerCard === "string" ? body.customerCard : "";
    const cardTokenUniqueId =
      typeof body.cardTokenUniqueId === "string" ? body.cardTokenUniqueId : "";

    if (!customerUniqueId || !customerCardToken) {
      return NextResponse.json({ error: "Malformed webhook" }, { status: 400 });
    }

    const receivedHash =
      request.headers.get("x-fawaterak-hash") ??
      (typeof body.hashKey === "string" ? body.hashKey : "");
    if (!verifyTokenizationHash(customerUniqueId, customerCardToken, receivedHash)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Get billing info
    const billing = await db.billingInfo.findFirst({
      where: { user: { id: customerUniqueId } },
    });

    if (!billing) {
      return NextResponse.json({ error: "Billing info not found" }, { status: 404 });
    }

    // Idempotency: check if token already exists
    const fingerprint = fingerprintPaymentToken(customerCardToken);
    const existing = await db.paymentMethod.findFirst({
      where: { fingerprint },
    });

    if (existing) {
      return NextResponse.json({ received: true });
    }

    // Extract last 4 digits from masked card
    const lastFour = customerCard.slice(-4) || "****";
    const cardBrand =
      typeof body.cardBrand === "string" ? body.cardBrand : detectCardBrand(customerCard);

    // Check if this is the first card (make it default)
    const existingCount = await db.paymentMethod.count({
      where: { billingInfoId: billing.id },
    });

    await db.paymentMethod.create({
      data: {
        billingInfoId: billing.id,
        cardBrand,
        lastFour,
        expiryMonth: 0, // Fawaterak doesn't return expiry
        expiryYear: 0,
        isDefault: existingCount === 0,
        fingerprint,
        fawaterakToken: encryptPaymentToken(customerCardToken),
        customerUniqueId,
        cardTokenUniqueId: cardTokenUniqueId || customerCardToken,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Fawaterak tokenization webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
