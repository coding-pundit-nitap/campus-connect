/*
  Warnings:

  - A unique constraint covering the columns `[cart_id,product_id]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cart_id_product_id_key" ON "public"."CartItem"("cart_id", "product_id");
