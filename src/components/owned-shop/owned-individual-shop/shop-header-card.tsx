import {
  Calendar,
  Clock,
  Edit,
  Eye,
  ListOrdered,
  MapPin,
  Store,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  const createdDate = new Date(shop.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row">
          <Avatar className="h-24 w-24 border">
            <AvatarImage src={shopImageUrl} alt={shop.name} />
            <AvatarFallback className="bg-muted">
              <Store className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{shop.name}</CardTitle>
                <Badge
                  variant={shop.is_active ? "default" : "secondary"}
                  className={
                    shop.is_active
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-gray-400"
                  }
                >
                  {shop.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`${statusInfo.bgClassName} hover:${statusInfo.bgClassName} text-white`}
                >
                  <statusInfo.Icon className="mr-1.5 h-3.5 w-3.5" />
                  {statusInfo.label}
                </Badge>
                <Button asChild variant="outline" size="icon">
                  <Link href="/owner-shops/edit">
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div
              className="mt-1 text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: shop.description }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{shop.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {shop.opening} - {shop.closing}
              </span>
              <Badge
                variant="outline"
                className={
                  isOpen
                    ? "border-green-500 text-green-500"
                    : "border-red-500 text-red-500"
                }
              >
                {isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Created {createdDate}
              </span>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">Payment Information</h4>
            <ShopPaymentInfo
              upiId={shop.upi_id}
              qrImageKey={shop.qr_image_key}
            />
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="p-4">
          <div className="flex flex-col md:flex-row justify-between w-full gap-2">
            <Button asChild variant="outline">
              <Link href={`/shops/${shop.id}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                View Public Page
              </Link>
            </Button>
            <div className="flex flex-col md:flex-row gap-2">
              <Button asChild variant="outline">
                <Link href={`/owner-shops/products`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Manage Products
                </Link>
              </Button>
              <Button asChild>
                <Link href="/owner-shops/orders">
                  <ListOrdered className="mr-2 h-4 w-4" />
                  Manage Orders
                </Link>
              </Button>
            </div>
          </div>
        </CardFooter>
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
