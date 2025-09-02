import { Product } from "@prisma/client";
import React from "react";

import { SharedCard } from "@/components/shared/shared-card";
import { ProductFormData } from "@/validations";

import { ProductCardActions } from "./product-card-actions";
import { ProductCardDetails } from "./product-card-details";
import { ProductCardHeader } from "./product-card-header";

interface ProductCardProps {
  product: Product;
  discountedPrice: string;
  productHasDiscount: boolean;
  productHasRating: boolean;
  formattedDate: string;
  onEdit: (product: ProductFormData) => void;
  onDelete: (productId: string) => void;
  priority?: boolean;
}

export function ProductCard({
  product,
  discountedPrice,
  productHasDiscount,
  productHasRating,
  formattedDate,
  onEdit,
  onDelete,
  priority = false,
}: ProductCardProps) {
  return (
    <SharedCard
      className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden"
      headerClassName="p-0"
      showFooter={true}
      headerContent={
        <ProductCardHeader product={product} priority={priority} />
      }
      footerContent={
        <ProductCardActions
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      }
    >
      <ProductCardDetails
        product={product}
        discountedPrice={discountedPrice}
        productHasDiscount={productHasDiscount}
        productHasRating={productHasRating}
        formattedDate={formattedDate}
      />
    </SharedCard>
  );
}
