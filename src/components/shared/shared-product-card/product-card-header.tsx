import Image from "next/image";
import React from "react";

import { SerializedProduct } from "@/lib/utils-functions/product.utils";

interface ProductCardHeaderProps {
  product: SerializedProduct;
  priority?: boolean;
}

export function ProductCardHeader({
  product,
  priority = false,
}: ProductCardHeaderProps) {
  return (
    <div className="aspect-square relative overflow-hidden">
      <Image
        src={product.image_url || "/placeholders/placeholder.png"}
        alt={product.name}
        fill
        className="object-cover"
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
    </div>
  );
}
