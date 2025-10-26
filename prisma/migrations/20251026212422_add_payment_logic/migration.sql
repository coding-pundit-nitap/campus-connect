/*
  Warnings:

  - You are about to alter the column `quantity` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to drop the column `imageKey` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `imageKey` on the `Shop` table. All the data in the column will be lost.
  - Added the required column `image_key` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image_key` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qr_image_key` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `upi_id` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payout" DROP CONSTRAINT "Payout_shop_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user" DROP CONSTRAINT "user_shop_id_fkey";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "user_id" DROP NOT NULL,
ALTER COLUMN "shop_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "quantity" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Payout" ALTER COLUMN "shop_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "imageKey",
ADD COLUMN     "image_key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "imageKey",
ADD COLUMN     "image_key" TEXT NOT NULL,
ADD COLUMN     "qr_image_key" TEXT NOT NULL,
ADD COLUMN     "upi_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "GlobalCounter" (
    "id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "order_count" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "GlobalCounter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
