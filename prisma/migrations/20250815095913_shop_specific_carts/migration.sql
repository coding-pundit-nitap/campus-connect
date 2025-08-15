/*
  Warnings:

  - A unique constraint covering the columns `[user_id,shop_id]` on the table `Cart` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shop_id` to the `Cart` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Cart_user_id_key";

-- AlterTable
ALTER TABLE "public"."Cart" ADD COLUMN     "shop_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Cart_user_id_shop_id_key" ON "public"."Cart"("user_id", "shop_id");

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
