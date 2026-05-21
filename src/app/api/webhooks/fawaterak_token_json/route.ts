import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/server/db";
import { fawaterakConfig } from "@/server/services/fawaterak/config";

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

  const a = Buffer.from(expected);
  const b = Buffer.from(receivedHash);
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
    const body = await request.json();
    const { customerUniqueId, customerCardToken, customerCard, cardTokenUniqueId } = body;

    // Verify hash from header
    const receivedHash = request.headers.get("x-fawaterak-hash") ?? "";
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
    const existing = await db.paymentMethod.findFirst({
      where: { fawaterakToken: customerCardToken },
    });

    if (existing) {
      return NextResponse.json({ received: true });
    }

    // Extract last 4 digits from masked card
    const lastFour = customerCard?.slice(-4) ?? "****";
    const cardBrand = customerCard ? detectCardBrand(customerCard) : "Card";

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
        fawaterakToken: customerCardToken,
        customerUniqueId,
        cardTokenUniqueId: cardTokenUniqueId ?? customerCardToken,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Fawaterak tokenization webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
