import { motion } from "framer-motion";
import React from "react";

import {
  ProductGrid,
  ProductListEmpty,
} from "@/components/shared/product-list";
import { Badge } from "@/components/ui/badge";
import { productUIServices } from "@/lib/utils";
import { SerializedProduct } from "@/types/product.types";

interface SharedProductsByCategoryProps {
  products: SerializedProduct[];
  renderProductCard: (
    product: SerializedProduct,
    index: number
  ) => React.ReactNode;
}
interface CategorySectionProps {
  categoryName: string;
  products: SerializedProduct[];
  renderProductCard: (
    product: SerializedProduct,
    index: number
  ) => React.ReactNode;
}

function CategorySection({
  categoryName,
  products,
  renderProductCard,
}: CategorySectionProps) {
  return (
    <section className="space-y-4">
      <div className="sticky top-0 z-10 px-4 border-b bg-background/95 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">{categoryName}</h2>
          <Badge variant="secondary">
            {products.length} {products.length === 1 ? "item" : "items"}
          </Badge>
        </div>
      </div>

      <ProductGrid count={products.length}>
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          >
            {renderProductCard(product, index)}
          </motion.div>
        ))}
      </ProductGrid>
    </section>
  );
}

export function SharedProductsByCategory({
  products,
  renderProductCard,
}: SharedProductsByCategoryProps) {
  const groupedProducts = productUIServices.groupProductsByCategory(products);

  if (groupedProducts.length === 0) {
    return <ProductListEmpty />;
  }

  return (
    <div className="space-y-12">
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
