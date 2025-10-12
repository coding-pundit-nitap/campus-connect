import Image from "next/image";
import React from "react";

import { ImageUtils } from "@/lib/utils-functions";
import { SerializedProduct } from "@/types/product.types";

interface ProductCardHeaderProps {
  product: SerializedProduct;
  priority?: boolean;
  isMobileList?: boolean;
}

export function ProductCardHeader({
  product,
  priority = false,
  isMobileList = false,
}: ProductCardHeaderProps) {
  return (
    <div
      className={`relative overflow-hidden ${isMobileList ? "h-full w-full" : "aspect-square"}`}
    >
      <Image
        src={ImageUtils.getImageUrl(product.imageKey)}
        alt={product.name}
        fill
        className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        priority={priority}
        sizes="(max-width: 640px) 96px, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
    </div>
  );
}
