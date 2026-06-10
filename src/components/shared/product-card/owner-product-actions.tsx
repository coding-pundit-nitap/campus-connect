"use client";

import React from "react";

import { ProductEditDialog } from "@/components/owned-shop/product-card/product-edit-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCategorySearch, useUpdateProductForm } from "@/hooks";
import { useToggleProductStock } from "@/hooks/queries/useShopProducts";
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

  const toggleStock = useToggleProductStock();
  const inStock = product.stock_quantity > 0;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between w-full p-2 border rounded-xl bg-card">
        <span className="text-xs font-bold text-muted-foreground">
          In Stock
        </span>
        <Switch
          checked={inStock}
          onCheckedChange={(checked) =>
            toggleStock.mutate({ productId: product.id, inStock: checked })
          }
          disabled={toggleStock.isPending}
        />
      </div>
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
