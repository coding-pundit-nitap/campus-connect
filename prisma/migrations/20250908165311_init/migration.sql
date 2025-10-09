/*
  Warnings:

  - You are about to drop the column `imageKey` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "imageKey",
ADD COLUMN     "image" TEXT;
