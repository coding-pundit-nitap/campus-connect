"use client";

import React from "react";

import { ProductEditDialog } from "@/components/owned-shop/product-card/product-edit-dialog";
import { Button } from "@/components/ui/button";
import { useCategorySearch, useUpdateProductForm } from "@/hooks";
import { ImageUtils } from "@/lib/utils";
import { productUIServices } from "@/lib/utils/product.utils";
import { FormFieldConfig } from "@/types";
import { SerializedProduct } from "@/types/product.types";
import { ProductUpdateActionFormData } from "@/validations";

interface OwnerProductActionsProps {
  product: SerializedProduct;
  onDelete: (product_id: string, image_key: string) => Promise<void>;
}

export function OwnerProductActions({
  product,
  onDelete,
}: OwnerProductActionsProps) {
  const { suggestions, isLoadingSuggestions, onSearchQuery } =
    useCategorySearch();
  const productFormHook = useUpdateProductForm({ product });
  const baseFields = productUIServices.createProductFormFields();
  const fields = baseFields.map((field) => {
    if (field.name === "category") {
      return { ...field, suggestions, isLoadingSuggestions, onSearchQuery };
    }
    if (field.name === "image" && product.image_key) {
      return {
        ...field,
        previewUrl: ImageUtils.getImageUrl(product.image_key),
      };
    }
    return field;
  }) as FormFieldConfig<ProductUpdateActionFormData>[];

  return (
    <div className="flex w-full flex-col gap-2">
      <ProductEditDialog
        product={product}
        form={productFormHook.form}
        state={productFormHook.state}
        handlers={productFormHook.handlers}
        fields={fields}
        className="w-full transition-transform duration-200 hover:scale-[1.02]"
        isDialogOpen={productFormHook.isDialogOpen}
        setIsDialogOpen={productFormHook.setIsDialogOpen}
      />
      <Button
        onClick={() => onDelete(product.id, product.image_key)}
        variant="destructive"
        className="w-full transition-transform duration-200 hover:scale-[1.02]"
      >
        Delete
      </Button>
    </div>
  );
}
