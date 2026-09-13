-- AlterEnum
ALTER TYPE "BatchStatus" ADD VALUE 'PENDING_REVIEW';

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "collective_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "min_order_value_snapshot" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "batch_min_order_value" DECIMAL(10,2);

-- Backfill collective_total for existing OPEN batches
UPDATE "Batch" b
SET collective_total = COALESCE((
  SELECT SUM(o.item_total) FROM "Order" o
  WHERE o.batch_id = b.id
), 0)
WHERE b.status = 'OPEN';
