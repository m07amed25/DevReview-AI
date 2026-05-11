-- AlterEnum: Add SEQUENCE to DiagramType (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'SEQUENCE'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'DiagramType')
  ) THEN
    ALTER TYPE "DiagramType" ADD VALUE 'SEQUENCE';
  END IF;
END$$;
