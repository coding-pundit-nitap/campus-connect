import { Product } from "@prisma/client";
import Image from "next/image";
import React from "react";

interface ProductCardHeaderProps {
  product: Product;
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
        className="object-cover group-hover:scale-105 transition-transform duration-200"
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
    </div>
  );
}
