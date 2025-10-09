import { SellerVerificationStatus } from "@prisma/client";
import { Clock, MapPin, Store } from "lucide-react";
import Link from "next/link";
import React from "react";

import { ShopEditFormContainer } from "@/components/owned-shop/shop-edit";
import { SharedCard } from "@/components/shared/shared-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImageUtils } from "@/lib/utils-functions/image.utils";
import { ShopWithOwner } from "@/types";

interface ShopCardProps {
  shop: ShopWithOwner;
}

export default function ShopCard({ shop }: ShopCardProps) {
  const getStatusColor = (verification_status: SellerVerificationStatus) => {
    switch (verification_status) {
      case "VERIFIED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "REQUIRES_ACTION":
        return "bg-orange-500";
      case "PENDING":
        return "bg-blue-500";
      case "NOT_STARTED":
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusText = (status: SellerVerificationStatus) => {
    const statusMap: Record<SellerVerificationStatus, string> = {
      VERIFIED: "Verified",
      PENDING: "Pending Review",
      REJECTED: "Rejected",
      REQUIRES_ACTION: "Action Required",
      NOT_STARTED: "Not Started",
    };
    return statusMap[status] || status.replaceAll("_", " ");
  };

  const shopImageUrl = shop.imageKey
    ? ImageUtils.getImageUrl(shop.imageKey)
    : null;

  return (
    <SharedCard showHeader={false} className="overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 p-6">
        <div className="flex-shrink-0">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
            <AvatarImage src={shopImageUrl || undefined} alt={shop.name} />
            <AvatarFallback className="text-2xl font-semibold bg-primary/10">
              <Store className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {shop.name}
              </h2>
              <p className="text-muted-foreground mt-1">{shop.description}</p>
            </div>
            <Badge
              className={`${getStatusColor(shop.verification_status)} text-white shrink-0`}
            >
              {getStatusText(shop.verification_status)}
            </Badge>
            <ShopEditFormContainer shop={shop} className="w-full sm:w-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium">{shop.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Hours:</span>
              <span className="font-medium">
                {shop.opening} - {shop.closing}
              </span>
            </div>
          </div>

          {shop.pg_seller_id && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">PG Seller ID:</span>
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                {shop.pg_seller_id}
              </span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-muted/30">
        <Button asChild>
          <Link href={`/owner-shops/${shop.id}`}>
            <Store className="w-4 h-4 mr-2" />
            Manage Shop & Products
          </Link>
        </Button>
        <Link href="owner-shops/orders">
          <Button variant="outline">
            <span className="mr-2">View Orders</span>
          </Button>
        </Link>
      </div>
    </SharedCard>
  );
}
