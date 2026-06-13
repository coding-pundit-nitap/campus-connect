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
import { shopAPIService } from "@/services/shop/shop-api.service";

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
      className="flex flex-col items-center gap-2 shrink-0 snap-start group relative"
    >
      <div
        className={cn(
          "relative w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-card border-2 border-border p-3 flex flex-col items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer shadow-xs hover:shadow-md",
          open
            ? "hover:border-emerald-500/50 hover:shadow-emerald-500/5 dark:hover:shadow-emerald-950/20"
            : "hover:border-red-500/50 hover:shadow-red-500/5 dark:hover:shadow-red-950/20"
        )}
      >
        <div className="relative w-12 h-12 md:w-14 md:h-14 overflow-hidden rounded-xl border border-muted bg-muted/20 flex items-center justify-center">
          {shop.image_key ? (
            <Image
              src={ImageUtils.getImageUrl(shop.image_key)}
              alt={shop.name}
              fill
              sizes="(max-width: 768px) 48px, 56px"
              className={cn(
                "object-cover transition-transform duration-500 group-hover:scale-108",
                !open && "grayscale contrast-75 brightness-75"
              )}
            />
          ) : (
            <Store
              className={cn(
                "w-6 h-6 text-muted-foreground transition-colors group-hover:text-primary",
                !open && "grayscale"
              )}
            />
          )}
        </div>

        <span className="text-[11px] md:text-xs font-heading font-black text-center text-foreground max-w-full truncate block capitalize tracking-wide leading-tight">
          {shop.name}
        </span>

        {open ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Open
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-wider select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Closed
          </span>
        )}
      </div>
    </Link>
  );
}

function FavoriteShopsSkeleton() {
  return (
    <div className="w-full mb-6 relative px-4 md:px-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-32 bg-muted rounded-md animate-pulse" />
      </div>
      <div className="w-full flex items-center overflow-x-auto scrollbar-none gap-4 py-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-muted/50 border border-muted animate-pulse shrink-0"
          />
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
      <div className="flex items-center justify-between mb-4 px-4 md:px-1">
        <div className="flex items-center gap-2">
          <div className="bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 p-2 rounded-full">
            <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-heading font-black tracking-tight text-foreground flex items-center gap-1.5">
              Favorite Canteens
              <span className="text-[10px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Saved
              </span>
            </h2>
            <p className="text-xs text-muted-foreground font-sans font-medium">
              Quick access to canteens you love
            </p>
          </div>
        </div>

        <Link
          href={"/favorites" as Route}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-all duration-300 flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 active:scale-95 shadow-xs cursor-pointer"
        >
          Manage →
        </Link>
      </div>

      <div className="w-full flex items-center overflow-x-auto scrollbar-none snap-x snap-mandatory gap-4 py-1.5 px-4 md:px-1">
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
      <div className="flex items-center justify-between mb-4 px-4 md:px-1">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 p-2 rounded-full">
            <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500/10" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-heading font-black tracking-tight text-foreground flex items-center gap-1.5">
              Explore Canteens
              <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Discover
              </span>
            </h2>
            <p className="text-xs text-muted-foreground font-sans font-medium">
              Order from popular canteens on campus
            </p>
          </div>
        </div>

        <Link
          href="/shops"
          className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-all duration-300 flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 active:scale-95 shadow-xs cursor-pointer"
        >
          See All →
        </Link>
      </div>

      <div className="w-full flex items-center overflow-x-auto scrollbar-none snap-x snap-mandatory gap-4 py-1.5 px-4 md:px-1">
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
