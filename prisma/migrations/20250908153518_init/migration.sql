/*
  Warnings:

  - You are about to drop the column `image_url` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - Added the required column `imageKey` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "image_url",
ADD COLUMN     "imageKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Shop" ADD COLUMN     "imageKey" TEXT;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "image",
ADD COLUMN     "imageKey" TEXT;
