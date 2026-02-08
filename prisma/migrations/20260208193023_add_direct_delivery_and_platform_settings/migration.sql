/*
  Warnings:

  - You are about to drop the column `default_platform_fee` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "is_direct_delivery" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "default_platform_fee",
ADD COLUMN     "direct_delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "platform_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
