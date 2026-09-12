"use client";

import { Package } from "lucide-react";
import Image from "next/image";

import { cardSurfaceClass } from "@/components/shared/form-styles";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { sanitizeHTML } from "@/lib/sanitize";

export interface ProductDrawerPreviewProps {
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

export function ProductDrawerPreview({
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
}: ProductDrawerPreviewProps) {
  return (
    <div className={cn(cardSurfaceClass, "overflow-hidden")}>
      <div className="relative aspect-[4/3] overflow-hidden border-b border-border/40 bg-muted/20">
        {imagePreview ? (
          <Image
            src={imagePreview}
            alt={watchedName || "Product preview"}
            fill
            className="object-contain p-4"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground/40">
            <Package className="h-10 w-10" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              No image yet
            </span>
          </div>
        )}
        {hasDiscount && (
          <Badge className="absolute left-3 top-3 rounded-md border-none bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
            -{discount}%
          </Badge>
        )}
      </div>

      <div className="space-y-2.5 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {watchedCategory ? (
            <Badge
              variant="outline"
              className="rounded-full border-indigo-500/20 bg-indigo-500/5 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600 dark:border-indigo-500/25 dark:bg-indigo-500/15 dark:text-indigo-400"
            >
              {watchedCategory}
            </Badge>
          ) : (
            <span className="text-[10px] italic text-muted-foreground/60">
              Uncategorized
            </span>
          )}
          {watchedBrand ? (
            <Badge
              variant="outline"
              className="rounded-full border-border/50 bg-muted/40 px-2.5 py-0.5 text-[11px] font-semibold text-foreground"
            >
              {watchedBrand}
            </Badge>
          ) : null}
        </div>

        <h3 className="truncate font-heading text-base font-bold tracking-tight text-foreground">
          {watchedName || "Product name"}
        </h3>

        {watchedDescription ? (
          <div
            className="line-clamp-2 text-xs leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(watchedDescription) || "",
            }}
          />
        ) : (
          <p className="line-clamp-2 text-xs italic text-muted-foreground/50">
            Description will appear here as you type.
          </p>
        )}

        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-xl font-extrabold text-foreground">
            ₹{discountedPrice.toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="text-sm font-medium text-muted-foreground/60 line-through">
              ₹{price}
            </span>
          )}
        </div>

        <p className="text-[11px] font-medium text-muted-foreground">
          {stockQuantity === 0
            ? "Out of stock"
            : `${stockQuantity} in stock`}
        </p>
      </div>
    </div>
  );
}
