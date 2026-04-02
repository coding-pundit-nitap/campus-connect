import { CheckCircle, Clock, MapPin, User, XCircle } from "lucide-react";
import { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { FavoriteShopButton } from "@/components/shops/favorite-shop-button";
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
import { ShopStatusBadge } from "@/components/ui/shop-status-badge";
import { sanitizeHTML } from "@/lib/sanitize";
import { ShopWithOwnerDetails } from "@/lib/shop-utils";
import { ImageUtils } from "@/lib/utils/image.utils";

type Props = {
  shop: ShopWithOwnerDetails;
  priority: boolean;
};

export function ShopCard({ shop, priority }: Props) {
  return (
    <div className="group block">
      <Card className="flex h-full w-full flex-col overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative aspect-4/3 overflow-hidden">
          <Link
            href={`/shops/${shop.id}` as Route}
            className="block h-full w-full"
          >
            <Image
              fill
              src={ImageUtils.getImageUrl(shop.image_key)}
              alt={shop.name}
              priority={priority}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </Link>
          <div className="absolute top-2 left-2 z-10">
            <FavoriteShopButton shopId={shop.id} />
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge
              variant={shop.is_active ? "default" : "destructive"}
              className={
                shop.is_active ? "bg-green-500 hover:bg-green-600" : ""
              }
            >
              {shop.is_active ? (
                <CheckCircle className="mr-1 h-3 w-3" />
              ) : (
                <XCircle className="mr-1 h-3 w-3" />
              )}
              {shop.is_active ? "Active" : "Inactive"}
            </Badge>
            {shop.is_active && <ShopStatusBadge shop={shop} />}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="mb-1 line-clamp-2 text-xl font-bold">
              <Link
                href={`/shops/${shop.id}` as Route}
                className="transition-colors group-hover:text-primary hover:text-primary"
              >
                {shop.name}
              </Link>
            </CardTitle>
            <CardDescription
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(shop.description),
              }}
              className="mt-1 prose prose-sm dark:prose-invert max-w-none"
            />
          </CardHeader>

          <CardContent className="flex-1 space-y-3 p-0">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4 text-primary" />
              <span className="line-clamp-1">{shop.location}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              <span>
                {shop.openingFormatted} - {shop.closingFormatted}
              </span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="mr-2 h-4 w-4 text-primary" />
              <span className="line-clamp-1">
                By {shop.user ? shop.user.name : "Unknown"}
              </span>
            </div>
          </CardContent>

          <CardFooter className="p-0 pt-4">
            {shop.is_active ? (
              <Button className="w-full" asChild>
                <Link href={`/shops/${shop.id}` as Route}>Visit Shop</Link>
              </Button>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                Shop Inactive
              </Button>
            )}
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
