"use client";

import { ImageIcon, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { ImageUtils } from "@/lib/utils";

type ProductImageProps = {
  image_key: string;
  name: string;
  className?: string;
};

export default function ProductImage({
  image_key,
  name,
  className = "lg:col-span-5",
}: ProductImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Card className="sticky top-6 overflow-hidden group">
        <CardContent className="p-0 relative">
          <div
            className={cn(
              "relative aspect-square w-full overflow-hidden bg-muted/30 cursor-zoom-in transition-all duration-300",
              isZoomed && "cursor-zoom-out"
            )}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            {image_key && !imageError ? (
              <>
                <Image
                  src={ImageUtils.getImageUrl(image_key)}
                  alt={name}
                  fill
                  className={cn(
                    "object-contain transition-transform duration-500 ease-out",
                    isZoomed ? "scale-150" : "scale-100 group-hover:scale-105"
                  )}
                  onError={() => setImageError(true)}
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
                <div
                  className={cn(
                    "absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-sm",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                    isZoomed && "opacity-100"
                  )}
                >
                  <ZoomIn
                    className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform",
                      isZoomed && "rotate-180"
                    )}
                  />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <ImageIcon className="h-16 w-16 opacity-50" />
                <span className="text-sm">No image available</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center lg:hidden">
        {name}
      </p>
    </div>
  );
}
