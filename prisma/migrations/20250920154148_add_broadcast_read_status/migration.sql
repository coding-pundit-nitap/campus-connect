-- CreateTable
CREATE TABLE "public"."BroadcastReadStatus" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "broadcast_notification_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BroadcastReadStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BroadcastReadStatus_user_id_idx" ON "public"."BroadcastReadStatus"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastReadStatus_user_id_broadcast_notification_id_key" ON "public"."BroadcastReadStatus"("user_id", "broadcast_notification_id");

-- AddForeignKey
ALTER TABLE "public"."BroadcastReadStatus" ADD CONSTRAINT "BroadcastReadStatus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BroadcastReadStatus" ADD CONSTRAINT "BroadcastReadStatus_broadcast_notification_id_fkey" FOREIGN KEY ("broadcast_notification_id") REFERENCES "public"."broadcast_notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
