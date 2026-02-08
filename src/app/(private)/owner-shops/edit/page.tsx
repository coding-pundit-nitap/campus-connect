import { redirect } from "next/navigation";

import { ShopEditForm } from "@/components/owned-shop/shop-edit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import authUtils from "@/lib/utils/auth.utils.server";
import { shopRepository } from "@/repositories";
import { ShopUpdateFormShop } from "@/types/shop.types";

export default async function ShopEditPage() {
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
    <div className="container mx-auto max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Your Shop</CardTitle>
          <CardDescription>
            Update your shop's details, location, and opening hours. Changes
            will be visible to customers after saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShopEditForm shop={shop} />
        </CardContent>
      </Card>
    </div>
  );
}
