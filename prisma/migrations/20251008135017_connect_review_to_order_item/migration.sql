/*
  Warnings:

  - You are about to drop the column `review_id` on the `OrderItem` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."OrderItem_review_id_key";

-- AlterTable
ALTER TABLE "public"."OrderItem" DROP COLUMN "review_id";
