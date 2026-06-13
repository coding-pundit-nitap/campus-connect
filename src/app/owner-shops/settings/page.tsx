import { redirect } from "next/navigation";

import { DeliveryBuildingsManager } from "@/components/owned-shop/settings/delivery-buildings-manager";
import { ShopSettingsForm } from "@/components/owned-shop/settings/shop-settings-form";
import { shopRepository } from "@/di/container";
import authUtils from "@/lib/utils/auth.utils.server";
import { ShopUpdateFormShop } from "@/types/shop.types";

export default async function ShopSettingsPage() {
  const user_id = await authUtils.getUserId();
  const shopWithUser = await shopRepository.findByOwnerId(user_id, {
    select: {
      id: true,
      name: true,
      description: true,
      location: true,
      opening: true,
      closing: true,
      image_key: true,
      qr_image_key: true,
      upi_id: true,
      min_order_value: true,
      default_delivery_fee: true,
      direct_delivery_fee: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!shopWithUser) {
    redirect("/owner-shops");
  }

  const { user, ...shopData } = shopWithUser;

  const shop: ShopUpdateFormShop = {
    ...shopData,
    min_order_value: shopData.min_order_value.toString(),
    default_delivery_fee: shopData.default_delivery_fee.toString(),
    direct_delivery_fee: shopData.direct_delivery_fee.toString(),
    description: shopData.description ?? "",
    image_key: shopData.image_key ?? "",
    qr_image_key: shopData.qr_image_key ?? "",
    upi_id: shopData.upi_id ?? "",
    user: user ? { name: user.name, email: user.email } : null,
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-foreground">
            Operating & Fee Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed font-medium">
            Configure order basket minimums, direct and batch delivery rates,
            and active hostel delivery boundaries.
          </p>
        </div>

        <div className="border-t border-border/40 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-card/45 backdrop-blur-xl rounded-2xl border border-border/30 p-6 sm:p-8 relative shadow-xl shadow-blue-500/[0.01] overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-blue-500/20" />
              <ShopSettingsForm shop={shop} />
            </div>
          </div>

          {/* Delivery Buildings Column */}
          <div className="lg:col-span-5">
            <DeliveryBuildingsManager />
          </div>
        </div>
      </div>
    </div>
  );
}
