"use client";

import { Calendar, Clock, Edit, Eye, MapPin, Store } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";
import { sanitizeHTML } from "@/lib/sanitize";
import { getVerificationStatusInfo } from "@/lib/shop.utils";
import { ImageUtils } from "@/lib/utils/image.utils";
import { ShopWithOwner } from "@/types";
import { SellerVerificationStatus } from "@/types/prisma.types";

import { ShopPaymentInfo } from "./shop-payment-info";
import { ShopStatsCards } from "./shop-stats-cards";

interface ShopHeaderCardProps {
  shop: ShopWithOwner;
  stats?: {
    productCount: number;
    orderCount: number;
    categoryCount: number;
    pendingOrderCount: number;
  };
}

function isShopOpen(opening: string, closing: string): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [openHour, openMin] = opening.split(":").map(Number);
  const [closeHour, closeMin] = closing.split(":").map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime < closeTime;
}

export function ShopHeaderCard({ shop, stats }: ShopHeaderCardProps) {
  const statusInfo = getVerificationStatusInfo(
    shop.verification_status as SellerVerificationStatus
  );
  const shopImageUrl = shop.image_key
    ? ImageUtils.getImageUrl(shop.image_key)
    : undefined;

  const isOpen = isShopOpen(shop.opening, shop.closing);
  const createdDate = new Date(shop.created_at).toLocaleDateString();

  return (
    <div className="space-y-6">
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="shrink-0">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-2 shadow-sm">
                <AvatarImage
                  src={shopImageUrl}
                  alt={shop.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted">
                  <Store className="h-10 w-10 text-muted-foreground/50" />
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Main Info Section */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {shop.name}
                    </h2>
                    <Badge
                      className={cn(
                        "text-white shadow-sm",
                        statusInfo.bgClassName
                      )}
                    >
                      <statusInfo.Icon className="mr-1.5 h-3.5 w-3.5" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <div
                    className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-2xl leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(shop.description),
                    }}
                  />
                </div>

                {/* Consolidated Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="shadow-sm"
                  >
                    <Link href={`/shops/${shop.id}`} target="_blank">
                      <Eye className="mr-2 h-4 w-4" />
                      View Public Page
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="shadow-sm">
                    <Link href="/owner-shops/edit">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Shop
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Meta Data Row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-foreground">
                    {shop.location}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-foreground">
                    {shop.opening} - {shop.closing}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-1 border-transparent px-2 py-0 font-medium",
                      isOpen
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400"
                    )}
                  >
                    {isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Created {createdDate}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Payment Info Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              Payment Information
            </h4>
            <ShopPaymentInfo
              upiId={shop.upi_id}
              qrImageKey={shop.qr_image_key}
            />
          </div>
        </CardContent>
      </Card>

      {stats && (
        <ShopStatsCards
          productCount={stats.productCount}
          orderCount={stats.orderCount}
          categoryCount={stats.categoryCount}
          pendingOrderCount={stats.pendingOrderCount}
        />
      )}
    </div>
  );
}
