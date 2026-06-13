import { Store } from "lucide-react";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import { ShopProfileContent } from "@/components/owned-shop/shop-edit";
import authUtils from "@/lib/utils/auth.utils.server";
import { shopRepository } from "@/repositories";
import { ShopUpdateFormShop } from "@/types/shop.types";

export const metadata: Metadata = {
  title: "Shop Profile | Campus Connect",
  description:
    "Manage your shop profile, delivery settings, and visual assets.",
};

export default async function ShopProfilePage() {
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
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Premium hero header */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-border/80 bg-card p-6 md:p-8 shadow-xl">
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500" />
        {/* Background blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-56 h-56 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-80px] w-56 h-56 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 shrink-0">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest mb-2">
              Shop Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-foreground">
              {shopData.name || "Shop Profile"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed font-medium max-w-xl">
              Manage your shop profile, operational hours, delivery charges, UPI
              ID, and visual assets.
            </p>
          </div>
        </div>
      </div>

      <ShopProfileContent shop={shop} />
    </div>
  );
}
