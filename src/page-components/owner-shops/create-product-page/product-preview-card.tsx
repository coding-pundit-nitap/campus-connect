import { Eye, Package, Store } from "lucide-react";
import Image from "next/image";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { sanitizeHTML } from "@/lib/sanitize";

interface ProductPreviewCardProps {
  imagePreview: string | null;
  watchedName: string;
  watchedCategory: string;
  watchedBrand: string;
  watchedDescription: string | undefined;
  price: number;
  discountedPrice: number;
  hasDiscount: boolean;
  discount: number;
  stockQuantity: number;
}

export function ProductPreviewCard({
  imagePreview,
  watchedName,
  watchedCategory,
  watchedBrand,
  watchedDescription,
  price,
  discountedPrice,
  hasDiscount,
  discount,
  stockQuantity,
}: ProductPreviewCardProps) {
  return (
    <div className="sticky top-8 space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 pl-1">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <Eye className="w-3.5 h-3.5" />
        <span>Real-time Live Preview</span>
      </div>

      <div className="border border-border/30 bg-card/65 backdrop-blur-xl shadow-[4px_4px_0px_0px_rgba(37,99,235,0.12)] hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,0.25)] hover:border-primary/45 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 max-w-sm">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-tr from-primary/5 to-transparent flex items-center justify-center border-b border-border/50 min-h-[260px]">
          {imagePreview ? (
            <div className="relative w-full h-full p-4">
              <Image
                src={imagePreview}
                alt={watchedName || "Product preview"}
                fill
                className="object-contain p-4"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground/35 space-y-2">
              <Package className="w-12 h-12" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[10px]">
                No image uploaded
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10">
            {hasDiscount && (
              <Badge className="border border-orange-600/20 bg-orange-500 text-white font-black rounded-md shadow-xs uppercase tracking-wider text-[9px] px-2 py-0.5">
                -{discount}%
              </Badge>
            )}
            {stockQuantity === 0 && (
              <Badge
                variant="secondary"
                className="shadow-xs font-black rounded-md border border-border bg-card text-foreground text-[9px] tracking-wider uppercase px-2 py-0.5"
              >
                Out of Stock
              </Badge>
            )}
            {stockQuantity > 0 && stockQuantity <= 5 && (
              <Badge
                variant="secondary"
                className="border border-red-500/20 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[9px] tracking-wider uppercase px-2 py-0.5 animate-pulse"
              >
                Low Stock
              </Badge>
            )}
          </div>
          {stockQuantity === 0 && (
            <div className="absolute inset-0 bg-white/40 dark:bg-black/50 backdrop-blur-[1px] pointer-events-none" />
          )}
        </div>

        <div className="p-5 space-y-4 flex flex-col justify-between flex-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs gap-2">
              <div className="flex flex-wrap gap-1.5 items-center">
                {watchedCategory ? (
                  <Badge
                    variant="outline"
                    className="bg-indigo-500/5 text-indigo-600 border border-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/25 font-semibold text-[11px] rounded-full px-2.5 py-0.5"
                  >
                    {watchedCategory}
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground/60 italic font-medium">
                    Uncategorized
                  </span>
                )}
                {watchedBrand ? (
                  <Badge
                    variant="outline"
                    className="bg-indigo-500/5 text-indigo-600 border border-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/25 font-semibold text-[11px] rounded-full px-2.5 py-0.5"
                  >
                    {watchedBrand}
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground/60 italic font-medium">
                    Unbranded
                  </span>
                )}
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded-md">
                  <Store className="w-3.5 h-3.5 text-orange-500" />
                  <span className="truncate max-w-[80px]">Your Shop</span>
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="truncate font-heading font-black tracking-tight leading-tight text-foreground text-lg">
                {watchedName || "Product Name Preview"}
              </h3>
              {watchedDescription ? (
                <div
                  className="min-h-10 text-xs leading-relaxed text-muted-foreground line-clamp-2 prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHTML(watchedDescription) || "",
                  }}
                />
              ) : (
                <p className="text-xs text-muted-foreground/50 italic line-clamp-2 min-h-10 leading-relaxed font-medium">
                  Describe the item on the left to see the text mockup here...
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-black tracking-tight text-foreground text-2xl">
                ₹{discountedPrice.toFixed(0)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-muted-foreground/60 font-semibold line-through text-sm">
                    ₹{price}
                  </span>
                  <Badge
                    variant="destructive"
                    className="border-none bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 shadow-xs text-[10px] px-2 py-0.5 font-bold rounded-full"
                  >
                    {discount}% OFF
                  </Badge>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground/80 border-t border-muted/35 pt-3 text-xs font-medium">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0 shadow-xs",
                  stockQuantity === 0
                    ? "bg-rose-500 dark:bg-rose-400"
                    : stockQuantity <= 5
                      ? "bg-amber-500 dark:bg-amber-400 animate-pulse"
                      : "bg-emerald-500 dark:bg-emerald-400"
                )}
              />
              <span
                className={cn(
                  stockQuantity === 0
                    ? "text-rose-600 dark:text-rose-400"
                    : stockQuantity <= 5
                      ? "text-amber-500 dark:text-amber-400 font-bold"
                      : "text-emerald-600 dark:text-emerald-400 font-medium"
                )}
              >
                {stockQuantity === 0
                  ? "Out of Stock"
                  : stockQuantity <= 5
                    ? "Low Stock"
                    : "In Stock"}
              </span>
              <span className="text-[10px] opacity-75">
                ({stockQuantity} left)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
