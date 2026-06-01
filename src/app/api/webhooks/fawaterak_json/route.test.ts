/**
 * Integration tests for the Fawaterak webhook handler.
 *
 * Strategy: mock all external dependencies (Prisma, Redis, Inngest, fawaterakAdapter)
 * and exercise the handler logic end-to-end at the HTTP level.
 */

import { NextRequest } from "next/server";
import crypto from "crypto";

// ── Mock dependencies before importing handler ────────────────────────────────
const mockDbInvoice = {
  findUnique: jest.fn(),
  update: jest.fn(),
};
const mockDbWebhookDedup = {
  findUnique: jest.fn(),
  create: jest.fn(),
};
const mockDbPaymentEvent = {
  create: jest.fn(),
};
const mockTransaction = jest.fn();

jest.mock("@/server/db", () => ({
  db: {
    invoice: mockDbInvoice,
    webhookDedup: mockDbWebhookDedup,
    paymentEvent: mockDbPaymentEvent,
    $transaction: mockTransaction,
  },
}));

const mockInngestSend = jest.fn();
jest.mock("@/server/inngest", () => ({
  inngest: { send: mockInngestSend },
}));

const mockVerifySignature = jest.fn();
const mockNormalizeStatus = jest.fn();
jest.mock("@/server/services/gateways/fawaterak-adapter", () => ({
  fawaterakAdapter: {
    verifyWebhookSignature: mockVerifySignature,
    normalizeWebhookStatus: mockNormalizeStatus,
  },
}));

jest.mock("@/server/services/payment-workflow", () => ({
  activatePaidInvoice: jest.fn(),
  invoiceAmountMatches: jest.fn().mockReturnValue(true),
}));

jest.mock("pino", () => () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// ── Import handler after mocks are registered ─────────────────────────────────
// eslint-disable-next-line import/first
import { POST } from "./route";

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildRequest(body: Record<string, unknown>): NextRequest {
  const json = JSON.stringify(body);
  return new NextRequest("https://devreview.ai/api/webhooks/fawaterak_json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
  });
}

const INVOICE_ID = "inv_test_001";
const validPayload = {
  invoice_id: INVOICE_ID,
  invoice_status: "paid",
  amount: 99,
  payment_method: "credit_card",
  invoice_hash: "signature",
  ref: "REF-123",
};

const mockInvoice = {
  id: INVOICE_ID,
  userId: "user_1",
  status: "INITIATED",
  version: 1,
  amount: 99,
  fawaterakInvoiceKey: "key_abc",
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/webhooks/fawaterak_json", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Signature validation ───────────────────────────────────────────────────
  it("returns 401 when signature is invalid", async () => {
    mockVerifySignature.mockReturnValue(false);

    const req = buildRequest(validPayload);
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  // ── Duplicate detection ────────────────────────────────────────────────────
  it("returns 200 without processing when duplicate dedup record exists", async () => {
    mockVerifySignature.mockReturnValue(true);
    mockNormalizeStatus.mockReturnValue("paid");

    // Simulate dedup record already exists
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        webhookDedup: { findUnique: jest.fn().mockResolvedValue({ id: "dup" }), create: jest.fn() },
        invoice: { findUnique: jest.fn().mockResolvedValue(mockInvoice), update: jest.fn() },
        paymentEvent: { create: jest.fn() },
      };
      return fn(tx);
    });

    const req = buildRequest(validPayload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(true);
  });

  // ── Successful payment flow ────────────────────────────────────────────────
  it("processes a valid paid webhook and returns 200", async () => {
    mockVerifySignature.mockReturnValue(true);
    mockNormalizeStatus.mockReturnValue("paid");

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        webhookDedup: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
        },
        invoice: {
          findUnique: jest.fn().mockResolvedValue(mockInvoice),
          update: jest.fn().mockResolvedValue({ ...mockInvoice, version: 2 }),
        },
        paymentEvent: {
          create: jest.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const { activatePaidInvoice } = await import("@/server/services/payment-workflow");
    (activatePaidInvoice as jest.Mock).mockResolvedValue(undefined);

    mockInngestSend.mockResolvedValue(undefined);

    const req = buildRequest(validPayload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  // ── Invoice not found ──────────────────────────────────────────────────────
  it("returns 200 (soft reject) when invoice is not found", async () => {
    mockVerifySignature.mockReturnValue(true);
    mockNormalizeStatus.mockReturnValue("paid");

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        webhookDedup: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
        },
        invoice: {
          findUnique: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
        paymentEvent: { create: jest.fn() },
      };
      return fn(tx);
    });

    const req = buildRequest(validPayload);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(true);
  });

  // ── Unknown status ─────────────────────────────────────────────────────────
  it("returns 200 (soft reject) for unknown normalised status", async () => {
    mockVerifySignature.mockReturnValue(true);
    mockNormalizeStatus.mockReturnValue("unknown");

    const req = buildRequest({ ...validPayload, invoice_status: "unknown" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(true);
  });
});
