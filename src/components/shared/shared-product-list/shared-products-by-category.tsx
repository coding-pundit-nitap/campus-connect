import React from "react";

import {
  ProductGrid,
  ProductListEmpty,
} from "@/components/shared/shared-product-list";
import { productUIServices } from "@/lib/utils-functions";
import { SerializedProduct } from "@/types/product.types";

interface SharedProductsByCategoryProps {
  products: SerializedProduct[];
  renderProductCard: (
    product: SerializedProduct,
    index: number,
    isLastProduct: boolean,
    isNearEnd: boolean
  ) => React.ReactNode;
}

interface CategorySectionProps {
  categoryName: string;
  products: SerializedProduct[];
  renderProductCard: (
    product: SerializedProduct,
    index: number,
    isLastProduct: boolean,
    isNearEnd: boolean
  ) => React.ReactNode;
}

function CategorySection({
  categoryName,
  products,
  renderProductCard,
}: CategorySectionProps) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {categoryName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      <ProductGrid products={products} renderProductCard={renderProductCard} />
    </div>
  );
}

export function SharedProductsByCategory({
  products,
  renderProductCard,
}: SharedProductsByCategoryProps) {
  const groupedProducts = productUIServices.groupProductsByCategory(products);

  if (products.length === 0) {
    return <ProductListEmpty />;
  }

  if (groupedProducts.length === 0) {
    return <ProductListEmpty />;
  }

  return (
    <div className="space-y-8">
      {groupedProducts.map(({ categoryName, products: categoryProducts }) => (
        <CategorySection
          key={categoryName}
          categoryName={categoryName}
          products={categoryProducts}
          renderProductCard={renderProductCard}
        />
      ))}
    </div>
  );
}
