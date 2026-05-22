import Image from "next/image";
import React from "react";

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
      className={`relative overflow-hidden bg-violet-500/[0.02] to-transparent dark:from-indigo-500/10 dark:via-transparent dark:to-transparent flex items-center justify-center transition-colors duration-500 ${variant === "compact" ? "h-full w-full" : "aspect-square"}`}
    >
      <Image
        src={ImageUtils.getImageUrl(product.image_key)}
        alt={product.name}
        fill
        className="object-contain p-4 transition-all duration-500 ease-out group-hover:scale-105 group-hover:-rotate-1 group-hover:translate-y-[-2px] filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)] group-hover:drop-shadow-[0_16px_24px_rgba(99,102,241,0.12)]"
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
      <div className="absolute inset-0 bg-transparent pointer-events-none" />
    </div>
  );
}
