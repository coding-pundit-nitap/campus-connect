import { Product } from "@prisma/client";
import { Eye,Heart, ShoppingCart } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { useUpdateProductForm } from "@/hooks/useProductForm";
import { productUIServices } from "@/lib/utils-functions";
import { ProductFormData } from "@/validations";

import { ProductEditDialog } from "./product-edit-dialog";

interface ProductCardActionsProps {
  product: Product;
}

export function ProductCardActions({ product }: ProductCardActionsProps) {
  const fields = productUIServices.createProductFormFields();
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <div className="p-4 pt-0 space-y-2">
      <Button
        variant={isOutOfStock ? "outline" : "default"}
        className="w-full transition-all duration-200 hover:shadow-md"
        disabled={isOutOfStock}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="transition-all w-full duration-200 hover:shadow-sm"
      >
        <Eye className="w-3 h-3 mr-1" />
        View Details
      </Button>
    </div>
  );
}
