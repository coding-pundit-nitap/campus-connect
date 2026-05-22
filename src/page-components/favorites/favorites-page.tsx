"use client";

import {
  ChevronLeft,
  Heart,
  MapPin,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavoriteShops, useToggleFavoriteShop } from "@/hooks";
import { cn } from "@/lib/cn";
import { formatTime, isShopOpen } from "@/lib/shop-utils";
import { ImageUtils } from "@/lib/utils";

export default function FavoritesPage() {
  const {
    data: favorites = [],
    isLoading,
    isError,
    error,
  } = useFavoriteShops();
  const { mutate: toggleFavorite, isPending } = useToggleFavoriteShop();

  const handleUnfavorite = (event: React.MouseEvent, shopId: string) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(shopId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Custom Glassmorphic Page Header */}
      <div className="relative w-full border-b border-muted/80 bg-gradient-to-br from-indigo-50/45 via-background to-violet-50/30 dark:from-indigo-950/15 dark:via-background dark:to-violet-950/15 py-8 px-4 md:px-8 mb-6 shadow-sm overflow-hidden group">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-violet-500/15 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Link href="/">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <Heart className="w-3.5 h-3.5 fill-rose-500/10 text-rose-500" />
                <span>My Collection</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight mt-1 flex items-center gap-2.5">
              Favorite Canteens
            </h1>

            <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed font-medium">
              Manage your saved campus canteens and get quick access to menus,
              ratings, and operating times.
            </p>
          </div>

          {!isLoading && favorites.length > 0 ? (
            <div className="hidden lg:flex items-center gap-2 px-4 py-3 rounded-xl bg-card/45 backdrop-blur-sm border border-muted/80 shadow-xs">
              <div className="bg-rose-500/10 text-rose-500 p-1.5 rounded-lg">
                <Sparkles className="w-4 h-4 text-rose-500 fill-rose-500/10" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">
                  {favorites.length} Saved{" "}
                  {favorites.length === 1 ? "Shop" : "Shops"}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Instantly connected
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pb-12">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={index}
                className="overflow-hidden border border-muted/80"
              >
                <div className="relative h-44 bg-muted animate-pulse" />
                <CardContent className="p-5 flex flex-col gap-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between items-center mt-2">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            type="error"
            title="Failed to load favorite canteens"
            description={
              error instanceof Error
                ? error.message
                : "An error occurred. Please try again."
            }
          />
        ) : favorites.length === 0 ? (
          <EmptyState
            type="empty"
            title="No Saved Canteens Yet"
            description="Explore our campus directory, find canteens you love, and heart them to see them here for rapid navigation."
            icon={
              <Heart className="h-12 w-12 text-muted-foreground/60 stroke-[1.5]" />
            }
            action={
              <Button
                asChild
                className="font-bold cursor-pointer rounded-full shadow-sm hover:shadow-md"
              >
                <Link href="/shops">Explore Canteens</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => {
              const shop = fav.shop;
              const open = shop.is_active && isShopOpen(shop);
              const hasImage = !!shop.image_key;

              return (
                <Link
                  key={shop.id}
                  href={`/shops/${shop.id}`}
                  className="group relative flex flex-col rounded-2xl border border-muted/80 bg-card hover:bg-accent/15 overflow-hidden shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-300 transform hover:scale-[1.01]"
                >
                  {/* Shop Banner Image Cover */}
                  <div className="relative h-40 w-full overflow-hidden bg-muted">
                    {hasImage ? (
                      <Image
                        src={ImageUtils.getImageUrl(shop.image_key)}
                        alt={shop.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 380px"
                        className={cn(
                          "object-cover transition-transform duration-500 group-hover:scale-105",
                          !open && "grayscale contrast-75 brightness-75"
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-primary/70",
                          !open && "grayscale"
                        )}
                      >
                        <Store className="w-10 h-10 stroke-[1.5]" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                    <div className="absolute left-3 top-3 bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white px-2.5 py-1 rounded-full border border-white/10 tracking-wide uppercase">
                      🕒 {formatTime(shop.opening)} - {formatTime(shop.closing)}
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      disabled={isPending}
                      onClick={(e) => handleUnfavorite(e, shop.id)}
                      className="absolute right-3 top-3 h-8 w-8 rounded-full shadow-xs bg-rose-500 hover:bg-rose-600 text-white border border-rose-500/20 active:scale-95 transition-all cursor-pointer z-20"
                      title="Remove from favorites"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-foreground truncate group-hover:underline group-hover:text-primary transition-all capitalize leading-snug">
                          {shop.name}
                        </h2>

                        {open ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Open
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Closed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                        <MapPin className="h-3.5 h-3.5 shrink-0 text-muted-foreground/80" />
                        <span className="truncate">{shop.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-muted/50 pt-3.5 mt-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Navigate to Menu
                      </span>
                      <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform duration-300">
                        View Menu ➔
                      </span>
                    </div>
                  </CardContent>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
