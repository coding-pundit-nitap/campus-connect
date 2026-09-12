"use client";

import { Clock, MapPin, Wallet } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo } from "react";

import { ShopStatusBadge } from "@/components/ui/shop-status-badge";
import { cn } from "@/lib/cn";
import { sanitizeHTML } from "@/lib/sanitize";
import { formatTime } from "@/lib/shop-utils";
import { ImageUtils } from "@/lib/utils/image.utils";

export interface ShopPreviewValues {
  name: string;
  description: string;
  location: string;
  opening: string;
  closing: string;
  minOrderValue: number;
  image: File | string | undefined;
}

function useImagePreviewUrl(image: File | string | undefined) {
  const objectUrl = useMemo(
    () => (image instanceof File ? URL.createObjectURL(image) : null),
    [image]
  );

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  if (image instanceof File) return objectUrl;
  return ImageUtils.getImageUrl(image);
}

const TIME_RANGE_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function safeFormatTime(time: string): string | null {
  if (!TIME_RANGE_REGEX.test(time)) return null;
  return formatTime(time);
}

export function ShopPreviewCard({
  values,
  className,
}: {
  values: ShopPreviewValues;
  className?: string;
}) {
  const imageUrl = useImagePreviewUrl(values.image);
  const openingFormatted = safeFormatTime(values.opening);
  const closingFormatted = safeFormatTime(values.closing);
  const descriptionHtml = sanitizeHTML(values.description || "");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm",
        className
      )}
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        {imageUrl && (
          <Image
            fill
            src={imageUrl}
            alt={values.name || "Your shop"}
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 360px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <div className="absolute top-2 right-2">
          {openingFormatted && closingFormatted && (
            <ShopStatusBadge
              shop={{
                opening: values.opening,
                closing: values.closing,
                is_active: true,
              }}
            />
          )}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-heading text-lg font-extrabold tracking-tight text-foreground line-clamp-1">
          {values.name || "Your shop name"}
        </h3>
        {descriptionHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            className="mt-1 line-clamp-2 min-h-[32px] max-w-none text-xs leading-relaxed text-muted-foreground prose prose-sm dark:prose-invert"
          />
        ) : (
          <p className="mt-1 min-h-[32px] text-xs leading-relaxed text-muted-foreground/60">
            Your description will appear here.
          </p>
        )}

        <div className="mt-3 space-y-2.5 border-t border-border/20 pt-3">
          <div className="flex items-center text-xs font-medium text-muted-foreground">
            <div className="mr-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-blue-500/5 bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <span className="line-clamp-1">
              {values.location || "Your pickup location"}
            </span>
          </div>
          <div className="flex items-center text-xs font-medium text-muted-foreground">
            <div className="mr-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-amber-500/5 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-500">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <span>
              {openingFormatted && closingFormatted
                ? `${openingFormatted} - ${closingFormatted}`
                : "Your opening hours"}
            </span>
          </div>
          <div className="flex items-center text-xs font-medium text-muted-foreground">
            <div className="mr-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-rose-500/5 bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <Wallet className="h-3.5 w-3.5" />
            </div>
            <span>Min order ₹{values.minOrderValue || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
