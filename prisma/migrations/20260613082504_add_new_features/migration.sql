/*
  Warnings:

  - A unique constraint covering the columns `[shop_id,cutoff_time]` on the table `Batch` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ShopType" AS ENUM ('CANTEEN', 'STATIONERY', 'GROCERY');

-- CreateEnum
CREATE TYPE "BatchMilestone" AS ENUM ('PACKING', 'CLIMB_STARTED', 'MIDWAY_100M_HILL', 'ARRIVED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "is_preorder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_veg" BOOLEAN;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "shop_type" "ShopType" NOT NULL DEFAULT 'CANTEEN';

-- CreateTable
CREATE TABLE "ShopAnnouncement" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "image_key" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "product_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchDeliveryStatus" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "current_milestone" "BatchMilestone" NOT NULL DEFAULT 'PACKING',
    "estimated_arrival" TIMESTAMP(3),
    "rider_name" TEXT,
    "rider_phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchDeliveryStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShopAnnouncement_shop_id_idx" ON "ShopAnnouncement"("shop_id");

-- CreateIndex
CREATE INDEX "ShopAnnouncement_expires_at_idx" ON "ShopAnnouncement"("expires_at");

-- CreateIndex
CREATE INDEX "ShopAnnouncement_product_id_idx" ON "ShopAnnouncement"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "BatchDeliveryStatus_batch_id_key" ON "BatchDeliveryStatus"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_shop_id_cutoff_time_key" ON "Batch"("shop_id", "cutoff_time");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_is_veg_idx" ON "Product"("is_veg");

-- CreateIndex
CREATE INDEX "Shop_shop_type_idx" ON "Shop"("shop_type");

-- AddForeignKey
ALTER TABLE "ShopAnnouncement" ADD CONSTRAINT "ShopAnnouncement_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopAnnouncement" ADD CONSTRAINT "ShopAnnouncement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchDeliveryStatus" ADD CONSTRAINT "BatchDeliveryStatus_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
