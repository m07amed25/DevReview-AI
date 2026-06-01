import {
  isValidTransition,
  getNextStatus,
  rebuildPaymentState,
  InvalidTransitionError,
} from "./payment-state-machine";
import type { InvoiceStatus, PaymentEventType } from "./payment-state-machine";

// ──────────────────────────────────────────────────────────────────────────────
// isValidTransition
// ──────────────────────────────────────────────────────────────────────────────
describe("isValidTransition", () => {
  const validCases: [InvoiceStatus, PaymentEventType][] = [
    ["PENDING", "PAYMENT_INITIATED"],
    ["INITIATED", "PAYMENT_AUTHORIZED"],
    ["INITIATED", "PAYMENT_SUCCEEDED"],
    ["INITIATED", "PAYMENT_FAILED"],
    ["INITIATED", "PAYMENT_PROCESSING"],
    ["PROCESSING", "PAYMENT_SUCCEEDED"],
    ["PROCESSING", "PAYMENT_FAILED"],
    ["AUTHORIZED", "PAYMENT_SUCCEEDED"],
    ["AUTHORIZED", "PAYMENT_FAILED"],
    ["PAID", "PAYMENT_REFUNDED"],
    ["PAID", "PAYMENT_PARTIALLY_REFUNDED"],
    ["PAID", "PAYMENT_DISPUTED"],
    ["DISPUTED", "PAYMENT_REFUNDED"],
    ["FAILED", "PAYMENT_INITIATED"],
    ["CANCELLED", "PAYMENT_INITIATED"],
  ];

  test.each(validCases)(
    "%s + %s should be valid",
    (status, event) => {
      expect(isValidTransition(status, event)).toBe(true);
    },
  );

  const invalidCases: [InvoiceStatus, PaymentEventType][] = [
    ["PAID", "PAYMENT_INITIATED"],
    ["PAID", "PAYMENT_SUCCEEDED"],
    ["PAID", "PAYMENT_FAILED"],
    ["PENDING", "PAYMENT_SUCCEEDED"],
    ["PARTIALLY_REFUNDED", "PAYMENT_SUCCEEDED"],
  ];

  test.each(invalidCases)(
    "%s + %s should be invalid",
    (status, event) => {
      expect(isValidTransition(status, event)).toBe(false);
    },
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// getNextStatus
// ──────────────────────────────────────────────────────────────────────────────
describe("getNextStatus", () => {
  it("transitions PENDING → INITIATED via PAYMENT_INITIATED", () => {
    expect(getNextStatus("PENDING", "PAYMENT_INITIATED")).toBe("INITIATED");
  });

  it("transitions PAID → PARTIALLY_REFUNDED via PAYMENT_PARTIALLY_REFUNDED", () => {
    expect(getNextStatus("PAID", "PAYMENT_PARTIALLY_REFUNDED")).toBe("PARTIALLY_REFUNDED");
  });

  it("transitions PAID → DISPUTED via PAYMENT_DISPUTED", () => {
    expect(getNextStatus("PAID", "PAYMENT_DISPUTED")).toBe("DISPUTED");
  });

  it("transitions DISPUTED → REFUNDED via PAYMENT_REFUNDED", () => {
    expect(getNextStatus("DISPUTED", "PAYMENT_REFUNDED")).toBe("REFUNDED");
  });

  it("allows retry: FAILED → INITIATED via PAYMENT_INITIATED", () => {
    expect(getNextStatus("FAILED", "PAYMENT_INITIATED")).toBe("INITIATED");
  });

  it("throws InvalidTransitionError for invalid transition", () => {
    expect(() => getNextStatus("PAID", "PAYMENT_INITIATED")).toThrow(InvalidTransitionError);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// rebuildPaymentState
// ──────────────────────────────────────────────────────────────────────────────
describe("rebuildPaymentState", () => {
  it("starts from PENDING with no events", () => {
    expect(rebuildPaymentState([])).toBe("PENDING");
  });

  it("replays a happy-path flow", () => {
    const result = rebuildPaymentState([
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() },
    ]);
    expect(result).toBe("PAID");
  });

  it("replays a full refund flow", () => {
    const result = rebuildPaymentState([
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() },
      { eventType: "PAYMENT_REFUNDED", createdAt: new Date() },
    ]);
    expect(result).toBe("REFUNDED");
  });

  it("replays a retry flow (FAILED → retry → success)", () => {
    const result = rebuildPaymentState([
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_FAILED", createdAt: new Date() },
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() },
    ]);
    expect(result).toBe("PAID");
  });

  it("skips invalid transitions instead of throwing", () => {
    // PAYMENT_SUCCEEDED after PAID is invalid — should be skipped silently
    const result = rebuildPaymentState([
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() }, // duplicate — invalid
    ]);
    expect(result).toBe("PAID");
  });

  it("replays disputed flow", () => {
    const result = rebuildPaymentState([
      { eventType: "PAYMENT_INITIATED", createdAt: new Date() },
      { eventType: "PAYMENT_SUCCEEDED", createdAt: new Date() },
      { eventType: "PAYMENT_DISPUTED", createdAt: new Date() },
    ]);
    expect(result).toBe("DISPUTED");
  });
});
