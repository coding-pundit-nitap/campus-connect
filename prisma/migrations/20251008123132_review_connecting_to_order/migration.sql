/*
  Warnings:

  - A unique constraint covering the columns `[review_id]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[order_item_id]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order_item_id` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."OrderItem" ADD COLUMN     "review_id" TEXT;

-- AlterTable
ALTER TABLE "public"."Review" ADD COLUMN     "order_item_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_review_id_key" ON "public"."OrderItem"("review_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_order_item_id_key" ON "public"."Review"("order_item_id");

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
