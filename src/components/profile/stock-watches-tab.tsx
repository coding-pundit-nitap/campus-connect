"use client";

import { Bell, BellOff, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SharedCard } from "@/components/shared/shared-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockWatches, useToggleStockWatch } from "@/hooks";
import { ImageUtils } from "@/lib/utils";

export function StockWatchesTab() {
  const { data: watches, isLoading, error } = useStockWatches();
  const { mutate: toggleWatch, isPending } = useToggleStockWatch();

  const handleRemove = (productId: string) => {
    toggleWatch(productId);
  };

  if (isLoading) {
    return (
      <SharedCard title="Stock Watches">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </SharedCard>
    );
  }

  if (error) {
    return (
      <SharedCard title="Stock Watches">
        <EmptyState
          icon={<Bell className="h-12 w-12 text-destructive" />}
          title="Failed to load stock watches"
          description="Please try again later"
        />
      </SharedCard>
    );
  }

  return (
    <SharedCard
      title="Stock Watches"
      description="Get notified when these products are back in stock"
    >
      {!watches || watches.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12 text-muted-foreground" />}
          title="No stock watches"
          description="Watch out-of-stock products to get notified when they're available"
          action={
            <Button asChild>
              <Link href="/shops">Browse Products</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {watches.map((watch) => (
            <div
              key={watch.id}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={ImageUtils.getImageUrl(watch.product.image_key)}
                  alt={watch.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/product/${watch.product.id}`}
                  className="font-semibold hover:underline truncate block"
                >
                  {watch.product.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {watch.product.shop.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-medium">₹{watch.product.price}</span>
                  {watch.product.stock_quantity > 0 ? (
                    <Badge variant="secondary" className="text-green-600">
                      Back in stock!
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-orange-600">
                      Out of stock
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {watch.product.stock_quantity > 0 && (
                  <Button asChild size="sm">
                    <Link href={`/product/${watch.product.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(watch.product.id)}
                  disabled={isPending}
                  className="text-muted-foreground"
                >
                  <BellOff className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SharedCard>
  );
}
