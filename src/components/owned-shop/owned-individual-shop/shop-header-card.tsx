import { Clock, Eye, ListOrdered, MapPin, Store } from "lucide-react";
import Link from "next/link";
import React from "react";

import { ShopEditFormContainer } from "@/components/owned-shop/shop-edit";
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
import { ImageUtils } from "@/lib/utils-functions/image.utils";
import { ShopWithOwner } from "@/types";

interface ShopHeaderCardProps {
  shop: ShopWithOwner;
}

export function ShopHeaderCard({ shop }: ShopHeaderCardProps) {
  const statusInfo = getVerificationStatusInfo(shop.verification_status);
  const shopImageUrl = shop.imageKey
    ? ImageUtils.getImageUrl(shop.imageKey)
    : undefined;

  return (
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
            <CardTitle className="text-2xl">{shop.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                className={`${statusInfo.bgClassName} hover:${statusInfo.bgClassName} text-white`}
              >
                <statusInfo.Icon className="mr-1.5 h-3.5 w-3.5" />
                {statusInfo.label}
              </Badge>
              <ShopEditFormContainer shop={shop} />
            </div>
          </div>
          <CardDescription className="mt-1">{shop.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{shop.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {shop.opening} - {shop.closing}
            </span>
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="p-4">
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button asChild variant="outline">
            <Link href={`/shops/${shop.id}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              View Public Page
            </Link>
          </Button>
          <Button asChild>
            <Link href="/owner-shops/orders">
              <ListOrdered className="mr-2 h-4 w-4" />
              Manage Orders
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
