"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, Sparkles,Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";

import { useFavoriteShops } from "@/hooks/queries/useProfileData";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { isShopOpen } from "@/lib/shop-utils";
import { ImageUtils } from "@/lib/utils";
import { shopAPIService } from "@/services/shop";

export default function FavoriteShopsStrip() {
  const { data: session } = useSession();
  const isGuest = !session?.user;

  const { data: favorites = [], isLoading: isLoadingFavorites } =
    useFavoriteShops(!!session?.user);

  const { data: fallbackShopsData, isLoading: isLoadingFallback } = useQuery({
    queryKey: ["shops", "recent-active"],
    queryFn: async () => {
      const res = await shopAPIService.fetchShops({ cursor: null });
      return res.data;
    },
    enabled: isGuest || (favorites.length === 0 && !isLoadingFavorites),
  });

  const fallbackShops = fallbackShopsData || [];
  const isFavoritesEmpty = favorites.length === 0;

  const isLoading = session?.user ? isLoadingFavorites : isLoadingFallback;
  if (isLoading) {
    return (
      <div className="w-full mb-6 relative px-4 md:px-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-24 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="w-full flex items-center overflow-x-auto scrollbar-none gap-5 py-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted/65 animate-pulse" />
              <div className="h-3 w-12 bg-muted/65 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isGuest && !isFavoritesEmpty) {
    return (
      <div className="w-full mb-6 relative">
        <div className="flex items-center gap-2 mb-3 px-4 md:px-1">
          <div className="bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 p-1.5 rounded-full">
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              Favorite Canteens
            </h2>
          </div>
        </div>

        <div className="w-full flex items-center overflow-x-auto scrollbar-none snap-x snap-mandatory gap-5 py-1.5 px-4 md:px-1">
          {favorites.slice(0, 8).map((fav) => {
            const shop = fav.shop;
            const open = shop.is_active && isShopOpen(shop);
            return (
              <Link
                key={shop.id}
                href={`/shops/${shop.id}`}
                className="flex flex-col items-center gap-1.5 shrink-0 snap-start group relative"
              >
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border border-muted bg-card overflow-hidden shadow-sm flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:border-primary/30">
                  {shop.image_key ? (
                    <Image
                      src={ImageUtils.getImageUrl(shop.image_key)}
                      alt={shop.name}
                      fill
                      sizes="(max-width: 768px) 64px, 80px"
                      className={cn(
                        "object-cover transition-transform duration-500 group-hover:scale-110",
                        !open && "grayscale contrast-75 brightness-75"
                      )}
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-primary",
                        !open && "grayscale"
                      )}
                    >
                      <Store className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                  )}

                  {!open ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-[10px] md:text-xs text-white font-extrabold tracking-wider uppercase bg-red-500/80 px-1 rounded-sm">
                        Closed
                      </span>
                    </div>
                  ) : null}
                </div>

                <span className="text-[11px] md:text-xs font-semibold text-center text-muted-foreground group-hover:text-foreground transition-colors max-w-[72px] md:max-w-[88px] truncate block capitalize">
                  {shop.name}
                </span>
                {open ? (
                  <span className="absolute top-0 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-background shadow-xs shadow-emerald-500 animate-pulse" />
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  if (fallbackShops.length === 0) return null;

  return (
    <div className="w-full mb-6 relative">
      <div className="flex items-center gap-2 mb-3 px-4 md:px-1">
        <div className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 p-1.5 rounded-full">
          <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500/10" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            Explore Canteens
          </h2>
        </div>
      </div>

      <div className="w-full flex items-center overflow-x-auto scrollbar-none snap-x snap-mandatory gap-5 py-1.5 px-4 md:px-1">
        {fallbackShops.slice(0, 8).map((shop) => {
          const open = shop.is_active && isShopOpen(shop);
          return (
            <Link
              key={shop.id}
              href={`/shops/${shop.id}`}
              className="flex flex-col items-center gap-1.5 shrink-0 snap-start group relative"
            >
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border border-muted bg-card overflow-hidden shadow-sm flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:border-primary/30">
                {shop.image_key ? (
                  <Image
                    src={ImageUtils.getImageUrl(shop.image_key)}
                    alt={shop.name}
                    fill
                    sizes="(max-width: 768px) 64px, 80px"
                    className={cn(
                      "object-cover transition-transform duration-500 group-hover:scale-110",
                      !open && "grayscale contrast-75 brightness-75"
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-primary",
                      !open && "grayscale"
                    )}
                  >
                    <Store className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                )}

                {!open ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-[10px] md:text-xs text-white font-extrabold tracking-wider uppercase bg-red-500/80 px-1 rounded-sm">
                      Closed
                    </span>
                  </div>
                ) : null}
              </div>

              <span className="text-[11px] md:text-xs font-semibold text-center text-muted-foreground group-hover:text-foreground transition-colors max-w-[72px] md:max-w-[88px] truncate block capitalize">
                {shop.name}
              </span>
              {open ? (
                <span className="absolute top-0 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-background shadow-xs shadow-emerald-500 animate-pulse" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
