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

export default async function ShopEditPage() {
  const user_id = await authUtils.getUserId();
  const shopWithUser = await shopRepository.findByOwnerId(user_id, {
    include: { user: { select: { name: true, email: true } } },
  });

  if (!shopWithUser) {
    redirect("/owner-shops");
  }

  const { user, ...shopData } = shopWithUser;
  const shop = {
    ...shopData,
    user: user
      ? { name: user.name, email: user.email }
      : { name: "Unknown", email: "Unknown" },
  };

  if (!shop) {
    redirect("/owner-shops");
  }

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
