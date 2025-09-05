-- AlterEnum
ALTER TYPE "public"."OrderStatus" ADD VALUE 'OUT_FOR_DELIVERY';

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "actual_delivery_time" TIMESTAMP(3),
ADD COLUMN     "estimated_delivery_time" TIMESTAMP(3),
ADD COLUMN     "requested_delivery_time" TIMESTAMP(3);
