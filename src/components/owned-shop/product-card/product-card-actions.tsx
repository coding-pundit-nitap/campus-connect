import { Product } from "@prisma/client";
import React from "react";

import { Button } from "@/components/ui/button";
import { useUpdateProductForm } from "@/hooks/useProductForm";
import { productUIServices } from "@/lib/utils-functions";
import { ProductFormData } from "@/validations";

import { ProductEditDialog } from "./product-edit-dialog";

interface ProductCardActionsProps {
  product: Product;
  onEdit: (product: ProductFormData) => void;
  onDelete: (productId: string) => void;
}

export function ProductCardActions({
  product,
  onEdit,
  onDelete,
}: ProductCardActionsProps) {
  const productFormHook = useUpdateProductForm({ product });
  const fields = productUIServices.createProductFormFields();

  return (
    <div className="flex flex-col justify-between w-full gap-2">
      <ProductEditDialog
        product={product}
        onEdit={onEdit}
        form={productFormHook.form}
        state={productFormHook.state}
        handlers={productFormHook.handlers}
        fields={fields}
        className="w-full"
      />
      <Button
        variant="destructive"
        onClick={() => onDelete(product.id)}
        className="w-full"
      >
        Delete
      </Button>
    </div>
  );
}
