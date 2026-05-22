"use client";

import { createContext, use, useMemo } from "react";

import { SerializedProduct } from "@/types/product.types";

interface ProductCardContextValue {
  product: SerializedProduct;
  discountedPrice: string;
  hasDiscount: boolean;
  hasRating: boolean;
  isOutOfStock: boolean;
  hasLowStock: boolean;
  priority: boolean;
}

const ProductCardContext = createContext<ProductCardContextValue | null>(null);

export function useProductCard(): ProductCardContextValue {
  const context = use(ProductCardContext);
  if (!context) {
    throw new Error(
      "useProductCard must be used within a ProductCard.Provider"
    );
  }
  return context;
}

function calculateDiscountedPrice(product: SerializedProduct): number {
  if (!product.discount || product.discount <= 0) {
    return product.price;
  }
  return product.price - (product.discount * product.price) / 100;
}

interface ProductCardProviderProps {
  product: SerializedProduct;
  priority?: boolean;
  children: React.ReactNode;
}

export function ProductCardProvider({
  product,
  priority = false,
  children,
}: ProductCardProviderProps) {
  const value = useMemo<ProductCardContextValue>(
    () => ({
      product,
      discountedPrice: calculateDiscountedPrice(product).toFixed(2),
      hasDiscount: product.discount !== null && product.discount > 0,
      hasRating: product.rating !== null && product.rating > 0,
      isOutOfStock: product.stock_quantity === 0,
      hasLowStock: product.stock_quantity > 0 && product.stock_quantity <= 5,
      priority,
    }),
    [product, priority]
  );

  return <ProductCardContext value={value}>{children}</ProductCardContext>;
}

export { calculateDiscountedPrice };
