/*
  Warnings:

  - You are about to drop the column `rating_count` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "rating_count",
ADD COLUMN     "rating_sum" INTEGER NOT NULL DEFAULT 0;
