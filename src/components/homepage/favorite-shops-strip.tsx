"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, Sparkles, Store } from "lucide-react";
import { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { useFavoriteShops } from "@/hooks/queries/useProfileData";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { isShopOpen } from "@/lib/shop-utils";
import { ImageUtils } from "@/lib/utils";
import { shopAPIService } from "@/services/shop";

interface CanteenCircleCardProps {
  shop: {
    id: string;
    name: string;
    image_key: string | null;
    is_active: boolean;
    opening: string;
    closing: string;
  };
}

function CanteenCircleCard({ shop }: CanteenCircleCardProps) {
  const open = shop.is_active && isShopOpen(shop);
  return (
    <Link
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
}

function FavoriteShopsSkeleton() {
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

interface FavoriteShopsFeedProps {
  favorites: Array<{
    shop: {
      id: string;
      name: string;
      image_key: string | null;
      is_active: boolean;
      opening: string;
      closing: string;
    };
  }>;
}

function FavoriteShopsFeed({ favorites }: FavoriteShopsFeedProps) {
  return (
    <div className="w-full mb-6 relative">
      <div className="flex items-center justify-between mb-3 px-4 md:px-1">
        <div className="flex items-center gap-2">
          <div className="bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 p-1.5 rounded-full">
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              Favorite Canteens
            </h2>
          </div>
        </div>

        <Link
          href={"/favorites" as Route}
          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-all duration-300 flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 active:scale-95 shadow-xs cursor-pointer"
        >
          Manage →
        </Link>
      </div>

      <div className="w-full flex items-center overflow-x-auto scrollbar-none snap-x snap-mandatory gap-5 py-1.5 px-4 md:px-1">
        {favorites.slice(0, 8).map((fav) => (
          <CanteenCircleCard key={fav.shop.id} shop={fav.shop} />
        ))}
      </div>
    </div>
  );
}

interface ExploreCanteensFeedProps {
  shops: Array<{
    id: string;
    name: string;
    image_key: string | null;
    is_active: boolean;
    opening: string;
    closing: string;
  }>;
}

function ExploreCanteensFeed({ shops }: ExploreCanteensFeedProps) {
  return (
    <div className="w-full mb-6 relative">
      <div className="flex items-center justify-between mb-3 px-4 md:px-1">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 p-1.5 rounded-full">
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500/10" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              Explore Canteens
            </h2>
          </div>
        </div>

        <Link
          href="/shops"
          className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-all duration-300 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 active:scale-95 shadow-xs cursor-pointer"
        >
          See All →
        </Link>
      </div>

      <div className="w-full flex items-center overflow-x-auto scrollbar-none snap-x snap-mandatory gap-5 py-1.5 px-4 md:px-1">
        {shops.slice(0, 8).map((shop) => (
          <CanteenCircleCard key={shop.id} shop={shop} />
        ))}
      </div>
    </div>
  );
}

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
    return <FavoriteShopsSkeleton />;
  }

  if (!isGuest && !isFavoritesEmpty) {
    return <FavoriteShopsFeed favorites={favorites} />;
  }
  if (fallbackShops.length > 0) {
    return <ExploreCanteensFeed shops={fallbackShops} />;
  }

  return null;
}
