import {
  Calendar,
  Clock,
  MapPin,
  Package,
  Store,
  Truck,
  User,
} from "lucide-react";
import { notFound } from "next/navigation";

import { FavoriteShopButton } from "@/components/shops/favorite-shop-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShopStatusBadge } from "@/components/ui/shop-status-badge";
import { shopRepository } from "@/di/container";
import { sanitizeHTML } from "@/lib/sanitize";
import { formatShopData } from "@/lib/shop-utils";
import { ImageUtils } from "@/lib/utils/image.utils";

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
    <Card className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl shadow-xl shadow-blue-500/[0.01] overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row items-start">
          <Avatar className="h-24 w-24 border border-border/20 rounded-2xl overflow-hidden shadow-md shrink-0">
            <AvatarImage
              src={shopImageUrl}
              alt={shop.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted">
              <Store className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-5 w-full">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black font-heading tracking-tight text-foreground mr-1">
                  {shop.name}
                </h1>
                <Badge
                  variant={shop.is_active ? "outline" : "destructive"}
                  className={
                    shop.is_active
                      ? "bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-xs font-bold"
                      : "bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-bold"
                  }
                >
                  {shop.is_active ? "Active" : "Inactive"}
                </Badge>
                <ShopStatusBadge shop={shop} />
                <Badge
                  variant={shop.accepting_orders ? "outline" : "outline"}
                  className={
                    shop.accepting_orders
                      ? "bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg text-xs font-bold"
                      : "bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg text-xs font-bold"
                  }
                >
                  {shop.accepting_orders ? "Accepting Orders" : "Orders Paused"}
                </Badge>
                <FavoriteShopButton shopId={shop.id} />
              </div>

              <div
                className="prose prose-sm max-w-none text-muted-foreground/90 leading-relaxed font-medium dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(shop.description),
                }}
              />
            </div>

            <div className="grid gap-3.5 text-xs sm:grid-cols-2 lg:grid-cols-4 border-t border-border/10 pt-4">
              <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/5">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-foreground font-semibold line-clamp-1">
                  {shop.location}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/5">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-foreground font-semibold">
                  {shop.openingFormatted} - {shop.closingFormatted}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/5">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-foreground font-semibold line-clamp-1">
                  By {shop.user?.name || "Campus Partner"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/5">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-foreground font-semibold">
                  Joined {createdDate}
                </span>
              </div>
            </div>

            <Separator className="bg-border/20" />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/20 bg-muted/15 p-4 flex items-center gap-3.5 shadow-xs transition-all hover:scale-[1.02]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/5">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">
                    Minimum Order
                  </p>
                  <p className="text-base font-extrabold text-foreground mt-0.5">
                    {formatCurrency(shop.min_order_value)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border/20 bg-muted/15 p-4 flex items-center gap-3.5 shadow-xs transition-all hover:scale-[1.02]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/5">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">
                    Batch Delivery Fee
                  </p>
                  <p className="text-base font-extrabold text-foreground mt-0.5">
                    {formatCurrency(shop.default_delivery_fee)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border/20 bg-muted/15 p-4 flex items-center gap-3.5 shadow-xs transition-all hover:scale-[1.02]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/5">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">
                    Direct Delivery Fee
                  </p>
                  <p className="text-base font-extrabold text-foreground mt-0.5">
                    {formatCurrency(shop.direct_delivery_fee)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
