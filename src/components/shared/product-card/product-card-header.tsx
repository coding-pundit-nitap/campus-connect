import Image from "next/image";
import React from "react";

import { cn } from "@/lib/cn";
import { ImageUtils } from "@/lib/utils";

import { useProductCard } from "./product-card-context";

interface ProductCardImageProps {
  variant?: "default" | "compact";
}

export function ProductCardImage({
  variant = "default",
}: ProductCardImageProps) {
  const { product, priority } = useProductCard();

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-tr from-primary/5 to-transparent flex items-center justify-center transition-colors duration-500 border-b border-border/50",
        variant === "compact" ? "h-full w-full" : "aspect-square"
      )}
    >
      <Image
        src={ImageUtils.getImageUrl(product.image_key)}
        alt={product.name}
        fill
        className="object-contain p-4 transition-all duration-500 ease-out group-hover:scale-105 group-hover:-rotate-1 group-hover:translate-y-[-2px] filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)] group-hover:drop-shadow-[0_16px_24px_rgba(37,99,235,0.18)]"
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
      <div className="absolute inset-0 bg-transparent pointer-events-none" />
    </div>
  );
}
