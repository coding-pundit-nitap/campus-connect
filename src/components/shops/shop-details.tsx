import { Calendar, Clock, MapPin, Store, Truck, User } from "lucide-react";
import { notFound } from "next/navigation";

import { FavoriteShopButton } from "@/components/shops/favorite-shop-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShopStatusBadge } from "@/components/ui/shop-status-badge";
import { sanitizeHTML } from "@/lib/sanitize";
import { formatShopData } from "@/lib/shop-utils";
import { ImageUtils } from "@/lib/utils/image.utils";
import shopRepository from "@/repositories/shop.repository";

type Props = {
  shop_id: string;
};

function formatCurrency(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return `\u20B9${value}`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export async function ShopDetails({ shop_id }: Props) {
  const shopData = await shopRepository.findById(shop_id, {
    include: { user: { select: { name: true, email: true } } },
  });

  if (!shopData) {
    notFound();
  }

  const shop = formatShopData(shopData);
  const shopImageUrl = ImageUtils.getImageUrl(shop.image_key);
  const createdDate = new Date(shop.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 md:flex-row">
          <Avatar className="h-24 w-24 border shadow-sm">
            <AvatarImage
              src={shopImageUrl}
              alt={shop.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted">
              <Store className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {shop.name}
                </h1>
                <Badge
                  variant={shop.is_active ? "default" : "destructive"}
                  className={
                    shop.is_active ? "bg-green-600 hover:bg-green-600" : ""
                  }
                >
                  {shop.is_active ? "Active" : "Inactive"}
                </Badge>
                <ShopStatusBadge shop={shop} />
                <Badge
                  variant={shop.accepting_orders ? "secondary" : "outline"}
                >
                  {shop.accepting_orders ? "Accepting Orders" : "Orders Paused"}
                </Badge>
                <FavoriteShopButton shopId={shop.id} />
              </div>

              <div
                className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(shop.description),
                }}
              />
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-foreground">{shop.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-foreground">
                  {shop.openingFormatted} - {shop.closingFormatted}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4 text-primary" />
                <span className="text-foreground">By {shop.user?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2 lg:col-span-1">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-foreground">Created {createdDate}</span>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Minimum Order</p>
                <p className="text-base font-semibold text-foreground">
                  {formatCurrency(shop.min_order_value)}
                </p>
              </div>

              <div className="rounded-md border bg-muted/30 p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Batch Delivery Fee</span>
                </div>
                <p className="text-base font-semibold text-foreground">
                  {formatCurrency(shop.default_delivery_fee)}
                </p>
              </div>

              <div className="rounded-md border bg-muted/30 p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Direct Delivery Fee</span>
                </div>
                <p className="text-base font-semibold text-foreground">
                  {formatCurrency(shop.direct_delivery_fee)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
