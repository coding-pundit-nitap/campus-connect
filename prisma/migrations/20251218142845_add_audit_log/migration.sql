-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "AdminAction" AS ENUM ('SHOP_VERIFY', 'SHOP_REJECT', 'SHOP_ACTIVATE', 'SHOP_DEACTIVATE', 'SHOP_DELETE', 'USER_MAKE_ADMIN', 'USER_REMOVE_ADMIN', 'USER_SUSPEND', 'USER_UNSUSPEND', 'USER_DELETE', 'USER_FORCE_SIGNOUT', 'BROADCAST_CREATE', 'ORDER_STATUS_OVERRIDE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customer_notes" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "suspended_at" TIMESTAMP(3),
ADD COLUMN     "suspended_reason" TEXT;

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" "AdminAction" NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_shop" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_watch" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_watch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_log_admin_id_idx" ON "admin_audit_log"("admin_id");

-- CreateIndex
CREATE INDEX "admin_audit_log_target_type_target_id_idx" ON "admin_audit_log"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "admin_audit_log_created_at_idx" ON "admin_audit_log"("created_at");

-- CreateIndex
CREATE INDEX "favorite_shop_user_id_idx" ON "favorite_shop"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_shop_user_id_shop_id_key" ON "favorite_shop"("user_id", "shop_id");

-- CreateIndex
CREATE INDEX "stock_watch_user_id_idx" ON "stock_watch"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_watch_user_id_product_id_key" ON "stock_watch"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "Product_deleted_at_idx" ON "Product"("deleted_at");

-- CreateIndex
CREATE INDEX "Shop_deleted_at_idx" ON "Shop"("deleted_at");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");

-- AddForeignKey
ALTER TABLE "favorite_shop" ADD CONSTRAINT "favorite_shop_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_shop" ADD CONSTRAINT "favorite_shop_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_watch" ADD CONSTRAINT "stock_watch_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_watch" ADD CONSTRAINT "stock_watch_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
