import { Product } from "@prisma/client";
import React from "react";

import { ProductFormData } from "@/validations";

interface ProductGridProps {
  products: Product[];
  onEditProduct?: (product: ProductFormData) => void;
  onDeleteProduct?: (productId: string) => void;
  lastElementRef?: (node: HTMLDivElement | null) => void;
  renderProductCard: (
    product: Product,
    index: number,
    isLastProduct: boolean,
    isNearEnd: boolean
  ) => React.ReactNode;
}

export function ProductGrid({
  products,
  lastElementRef,
  renderProductCard,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product, index) => {
        const isLastProduct = index === products.length - 1;
        const isNearEnd = index >= products.length - 3;

        return (
          <div
            key={product.id}
            ref={isLastProduct ? lastElementRef : undefined}
            className={isNearEnd ? "scroll-trigger" : ""}
          >
            {renderProductCard(product, index, isLastProduct, isNearEnd)}
          </div>
        );
      })}
    </div>
  );
}
