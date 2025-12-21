"use client";

import { Heart, MapPin, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavoriteShops, useToggleFavoriteShop } from "@/hooks";
import { ImageUtils } from "@/lib/utils";

export function FavoriteShopsTab() {
  const { data: favorites, isLoading, error } = useFavoriteShops();
  const { mutate: toggleFavorite, isPending } = useToggleFavoriteShop();

  const handleRemove = (shopId: string) => {
    toggleFavorite(shopId);
  };

  if (isLoading) {
    return (
      <SharedCard title="Favorite Shops">
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </SharedCard>
    );
  }

  if (error) {
    return (
      <SharedCard title="Favorite Shops">
        <EmptyState
          icon={<Heart className="h-12 w-12 text-destructive" />}
          title="Failed to load favorites"
          description="Please try again later"
        />
      </SharedCard>
    );
  }

  return (
    <SharedCard
      title="Favorite Shops"
      description="Shops you've saved for quick access"
    >
      {!favorites || favorites.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-12 w-12 text-muted-foreground" />}
          title="No favorite shops"
          description="Heart shops you love to see them here"
          action={
            <Button asChild>
              <Link href="/shops">Browse Shops</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={ImageUtils.getImageUrl(fav.shop.image_key)}
                  alt={fav.shop.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/shops/${fav.shop.id}`}
                  className="font-semibold hover:underline truncate block"
                >
                  {fav.shop.name}
                </Link>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{fav.shop.location}</span>
                </div>
                {!fav.shop.is_active && (
                  <span className="text-xs text-orange-500">
                    Temporarily closed
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(fav.shop.id)}
                disabled={isPending}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </SharedCard>
  );
}
