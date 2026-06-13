"use client";

import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellRing,
  BookOpen,
  Clock,
  Layers,
  Leaf,
  Loader2,
  Megaphone,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";

import type { SerializedAnnouncement } from "@/actions/vendor/announcement-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductActions } from "@/hooks/common/useProductActions";
import { useAnnouncements } from "@/hooks/queries/useAnnouncements";
import {
  useStockWatches,
  useToggleStockWatch,
} from "@/hooks/queries/useProfileData";
import { ImageUtils } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";

export default function FeedPage() {
  const [filter, setFilter] = useState<"ALL" | "CANTEEN" | "STATIONERY">("ALL");

  // Filter is applied at the backend; each unique filter value is cached separately
  const { data: announcements = [], isLoading } = useAnnouncements(filter);

  const { onAddToCart, isAddingToCart } = useProductActions({
    mode: "user",
  });

  const { data: stockWatches = [] } = useStockWatches(true);
  const { mutate: toggleWatch, isPending: isWatchingPending } =
    useToggleStockWatch();

  const activeWatchesSet = useMemo(() => {
    return new Set(stockWatches.map((w) => w.product.id));
  }, [stockWatches]);

  if (isLoading) {
    return (
      <main className="container mx-auto max-w-4xl py-10 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-muted-foreground font-bold mt-4">
          Loading campus announcements...
        </p>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4 space-y-8">
      <div className="relative overflow-hidden rounded-3xl border-2 border-border/80 bg-card p-6 md:p-8 shadow-xl ">
        <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] left-[-100px] w-64 h-64 bg-blue-600/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-black uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Live campus feed
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-4xl font-heading font-black text-foreground">
              Deals & Announcements
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl font-semibold leading-relaxed">
              Stay updated with daily canteen specials, limited-time roll
              discounts, and stationery restock notices around campus!
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        <Button
          size="sm"
          variant={filter === "ALL" ? "default" : "outline"}
          onClick={() => setFilter("ALL")}
          className={`rounded-xl h-9 px-4 font-bold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 shadow-xs border-2 ${
            filter === "ALL" ? "border-transparent" : "border-border/60 bg-card"
          }`}
        >
          <Layers className="h-3.5 w-3.5 mr-1.5" />
          All Announcements
        </Button>
        <Button
          size="sm"
          variant={filter === "CANTEEN" ? "default" : "outline"}
          onClick={() => setFilter("CANTEEN")}
          className={`rounded-xl h-9 px-4 font-bold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 shadow-xs border-2 ${
            filter === "CANTEEN"
              ? "border-transparent"
              : "border-border/60 bg-card"
          }`}
        >
          <Leaf className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
          Canteens & Food
        </Button>
        <Button
          size="sm"
          variant={filter === "STATIONERY" ? "default" : "outline"}
          onClick={() => setFilter("STATIONERY")}
          className={`rounded-xl h-9 px-4 font-bold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 shadow-xs border-2 ${
            filter === "STATIONERY"
              ? "border-transparent"
              : "border-border/60 bg-card"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
          Stationery & Essentials
        </Button>
      </div>

      <div className="space-y-6">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/70 rounded-2xl p-12 text-center bg-card/25 backdrop-blur-xl">
            <Megaphone className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="font-bold text-foreground">
              No active announcements
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed font-semibold">
              Check back later! Shop owners will post deals and notices here
              when available.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {announcements.map(
                (ann: SerializedAnnouncement, index: number) => {
                  const expiresAt = new Date(ann.expires_at);
                  const isCanteen = ann.shop_type === "CANTEEN";
                  const product = ann.product;
                  const isLiked = product
                    ? activeWatchesSet.has(product.id)
                    : false;

                  return (
                    <motion.div
                      key={ann.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="rounded-2xl border-2 border-border/80 bg-card/65 backdrop-blur-xl hover:scale-[1.01] hover:border-blue-500/20 hover:shadow-lg transition-all duration-200 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
                        <CardHeader className="pb-3 pl-8">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-blue-600 shrink-0" />
                              <span className="text-xs font-extrabold text-foreground tracking-tight">
                                {ann.shop_name}
                              </span>
                              <Badge
                                className={`text-[9px] px-1.5 py-0 rounded-md font-bold uppercase tracking-wider ${
                                  isCanteen
                                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600"
                                    : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-600"
                                }`}
                                variant="outline"
                              >
                                {isCanteen ? "Canteen" : "Stationery"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase bg-muted/40 px-2 py-0.5 rounded-md border border-border/10">
                              <Clock className="h-3 w-3" />
                              Expires{" "}
                              {formatDistanceToNow(expiresAt, {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                          <CardTitle className="text-lg font-black font-heading mt-2">
                            {ann.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4 pb-4 pl-8 pr-6">
                          <p className="text-xs text-muted-foreground/90 font-medium leading-relaxed">
                            {ann.message}
                          </p>

                          {product && (
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 flex flex-col sm:flex-row gap-4 items-center justify-between relative overflow-hidden">
                              <div className="absolute inset-0 bg-blue-600/[0.01]" />
                              <div className="flex items-center gap-3.5 min-w-0 z-10 w-full sm:w-auto">
                                <div className="h-12 w-12 rounded-xl bg-card border border-border/40 overflow-hidden flex items-center justify-center shrink-0">
                                  {product.image_key ? (
                                    <Image
                                      src={ImageUtils.getImageUrl(
                                        product.image_key
                                      )}
                                      alt={product.name}
                                      className="h-full w-full object-cover"
                                      width={48}
                                      height={48}
                                    />
                                  ) : (
                                    <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-foreground truncate block">
                                    {product.name}
                                  </span>
                                  {product.brand ? (
                                    <span className="text-[10px] text-muted-foreground font-semibold block">
                                      Brand: {product.brand}
                                    </span>
                                  ) : null}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-extrabold text-foreground font-mono">
                                      {formatCurrency(product.price)}
                                    </span>
                                    {product.discount ? (
                                      <span className="text-[10px] text-muted-foreground font-mono line-through">
                                        {formatCurrency(
                                          product.price + product.discount
                                        )}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 w-full sm:w-auto z-10 justify-end">
                                {product.stock_quantity <= 0 ? (
                                  <Button
                                    type="button"
                                    variant={isLiked ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleWatch(product.id)}
                                    disabled={isWatchingPending}
                                    className={`rounded-lg h-8 px-3.5 text-[10px] font-bold cursor-pointer transition-all hover:scale-102 active:scale-98 shadow-xs ${
                                      isLiked
                                        ? "bg-blue-600 hover:bg-blue-700 text-white border-none"
                                        : "border-border/60 bg-card hover:border-blue-600/30 hover:text-blue-600"
                                    }`}
                                  >
                                    {isLiked ? (
                                      <>
                                        <BellRing className="h-3 w-3 mr-1 animate-pulse" />
                                        Watching Stock
                                      </>
                                    ) : (
                                      <>
                                        <Bell className="h-3 w-3 mr-1" />
                                        Notify Restock
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => onAddToCart?.(product.id, 1)}
                                    disabled={isAddingToCart}
                                    className="rounded-lg h-8 px-3.5 text-[10px] font-bold cursor-pointer transition-all hover:scale-102 active:scale-98 shadow bg-blue-600 hover:bg-blue-700 text-white border-none flex items-center gap-1"
                                  >
                                    <ShoppingBag className="h-3 w-3" />
                                    Order Item
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                }
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
