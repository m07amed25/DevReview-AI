-- AddColumn Invoice.idempotencyKey
ALTER TABLE "invoice" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "invoice_idempotencyKey_key" ON "invoice"("idempotencyKey");

-- AddColumn Invoice.version
ALTER TABLE "invoice" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- Extend InvoiceStatus enum with new values
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'AUTHORIZED';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'INITIATED';

-- CreateEnum PaymentEventType
DO $$ BEGIN
    CREATE TYPE "PaymentEventType" AS ENUM (
        'PAYMENT_INITIATED',
        'PAYMENT_PROCESSING',
        'PAYMENT_AUTHORIZED',
        'PAYMENT_CAPTURED',
        'PAYMENT_SUCCEEDED',
        'PAYMENT_FAILED',
        'REFUND_REQUESTED',
        'REFUND_SUCCEEDED',
        'REFUND_FAILED',
        'DISPUTE_OPENED',
        'DISPUTE_RESOLVED',
        'PAYMENT_CANCELLED',
        'CREDIT_APPLIED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable payment_event (append-only ledger)
CREATE TABLE IF NOT EXISTS "payment_event" (
    "id"          TEXT        NOT NULL,
    "invoiceId"   TEXT        NOT NULL,
    "eventType"   "PaymentEventType" NOT NULL,
    "source"      TEXT        NOT NULL DEFAULT 'system',
    "metadata"    JSONB,
    "rawPayload"  JSONB,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_event_pkey" PRIMARY KEY ("id")
);

-- ForeignKey payment_event → invoice
ALTER TABLE "payment_event"
    ADD CONSTRAINT "payment_event_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes on payment_event
CREATE INDEX IF NOT EXISTS "payment_event_invoiceId_idx"           ON "payment_event"("invoiceId");
CREATE INDEX IF NOT EXISTS "payment_event_invoiceId_eventType_idx" ON "payment_event"("invoiceId", "eventType");
CREATE INDEX IF NOT EXISTS "payment_event_createdAt_idx"           ON "payment_event"("createdAt");

-- CreateTable webhook_dedup
CREATE TABLE IF NOT EXISTS "webhook_dedup" (
    "id"             TEXT         NOT NULL,
    "gatewayEventId" TEXT         NOT NULL,
    "eventType"      TEXT         NOT NULL,
    "receivedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_dedup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_dedup_gatewayEventId_key" ON "webhook_dedup"("gatewayEventId");
CREATE INDEX         IF NOT EXISTS "webhook_dedup_gatewayEventId_idx" ON "webhook_dedup"("gatewayEventId");

-- Immutability guard: prevent UPDATE and DELETE on payment_event
-- (PostgreSQL trigger approach — works with all drivers including Prisma)
CREATE OR REPLACE FUNCTION prevent_payment_event_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'payment_event rows are immutable — append only';
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_event_no_update ON "payment_event";
CREATE TRIGGER trg_payment_event_no_update
    BEFORE UPDATE ON "payment_event"
    FOR EACH ROW EXECUTE FUNCTION prevent_payment_event_mutation();

DROP TRIGGER IF EXISTS trg_payment_event_no_delete ON "payment_event";
CREATE TRIGGER trg_payment_event_no_delete
    BEFORE DELETE ON "payment_event"
    FOR EACH ROW EXECUTE FUNCTION prevent_payment_event_mutation();
