-- AlterTable
ALTER TABLE "UserAddress" ADD COLUMN     "building_id" TEXT;

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostel_block" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopDeliveryBuilding" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopDeliveryBuilding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Building_is_active_idx" ON "Building"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "Building_name_hostel_block_key" ON "Building"("name", "hostel_block");

-- CreateIndex
CREATE INDEX "ShopDeliveryBuilding_shop_id_idx" ON "ShopDeliveryBuilding"("shop_id");

-- CreateIndex
CREATE INDEX "ShopDeliveryBuilding_building_id_idx" ON "ShopDeliveryBuilding"("building_id");

-- CreateIndex
CREATE INDEX "ShopDeliveryBuilding_is_active_idx" ON "ShopDeliveryBuilding"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ShopDeliveryBuilding_shop_id_building_id_key" ON "ShopDeliveryBuilding"("shop_id", "building_id");

-- CreateIndex
CREATE INDEX "UserAddress_building_id_idx" ON "UserAddress"("building_id");

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopDeliveryBuilding" ADD CONSTRAINT "ShopDeliveryBuilding_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopDeliveryBuilding" ADD CONSTRAINT "ShopDeliveryBuilding_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;
