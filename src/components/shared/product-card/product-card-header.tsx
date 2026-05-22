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
      className={`relative overflow-hidden ${variant === "compact" ? "h-full" : "aspect-square"}`}
    >
      <Image
        src={ImageUtils.getImageUrl(product.image_key)}
        alt={product.name}
        fill
        className="object-contain transition-transform duration-300 ease-in-out group-hover:scale-105"
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
    </div>
  );
}
