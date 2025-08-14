/*
  Warnings:

  - You are about to alter the column `total_price` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `Payout` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `discount` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "total_price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."Payout" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(65,30);

-- CreateIndex
CREATE INDEX "CartItem_cart_id_idx" ON "public"."CartItem"("cart_id");

-- CreateIndex
CREATE INDEX "Order_user_id_idx" ON "public"."Order"("user_id");

-- CreateIndex
CREATE INDEX "Order_shop_id_idx" ON "public"."Order"("shop_id");

-- CreateIndex
CREATE INDEX "Order_order_status_idx" ON "public"."Order"("order_status");

-- CreateIndex
CREATE INDEX "Order_payment_status_idx" ON "public"."Order"("payment_status");

-- CreateIndex
CREATE INDEX "OrderItem_order_id_idx" ON "public"."OrderItem"("order_id");

-- CreateIndex
CREATE INDEX "Payout_shop_id_idx" ON "public"."Payout"("shop_id");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "public"."Payout"("status");

-- CreateIndex
CREATE INDEX "Product_shop_id_idx" ON "public"."Product"("shop_id");

-- CreateIndex
CREATE INDEX "Review_product_id_idx" ON "public"."Review"("product_id");

-- CreateIndex
CREATE INDEX "Review_user_id_idx" ON "public"."Review"("user_id");

-- CreateIndex
CREATE INDEX "Shop_verification_status_idx" ON "public"."Shop"("verification_status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");
