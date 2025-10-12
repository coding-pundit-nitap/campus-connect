/*
  Warnings:

  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "name" SET NOT NULL;

-- CreateIndex
CREATE INDEX "broadcast_notification_created_at_idx" ON "public"."broadcast_notification"("created_at");
