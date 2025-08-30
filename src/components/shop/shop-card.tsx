import { SellerVerificationStatus, Shop } from "@prisma/client";
import Link from "next/link";
import React from "react";

import { SharedCard } from "../shared/shared-card";
import { Badge } from "../ui/badge";

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  const getStatusColor = (verification_status: SellerVerificationStatus) => {
    switch (verification_status) {
      case "VERIFIED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "REQUIRES_ACTION":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusText = (status: SellerVerificationStatus) => {
    return status.replace("_", " ").toUpperCase();
  };
  return (
    <SharedCard showHeader={false} title={shop.name}>
      <Link
        href={`/shops/${shop.id}`}
        className="flex flex-row justify-between gap-2"
      >
        <div className="flex flex-col">
          <span className="font-medium">{shop.name}</span>
          <span className="text-sm text-muted-foreground">
            {shop.description}
          </span>
          <span className="text-sm text-muted-foreground">
            {shop.opening} - {shop.closing}
          </span>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Badge className={getStatusColor(shop.verification_status)}>
            {getStatusText(shop.verification_status)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Location: {shop.location}
          </span>
          <span className="text-sm text-muted-foreground">
            Owner: {shop.owner_id}
          </span>
          <span className="text-sm text-muted-foreground">
            PG Seller: {shop.pg_seller_id}
          </span>
        </div>
      </Link>
    </SharedCard>
  );
}
