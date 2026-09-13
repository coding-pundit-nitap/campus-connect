"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";

import { InlinePriceEdit } from "@/components/shared/product-drawer/inline-price-edit";
import {
  ProductDrawerForm,
  ProductDrawerFormValues,
} from "@/components/shared/product-drawer/product-drawer-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  useBrandSearch,
  useCategorySearch,
  useUpdateProductForm,
} from "@/hooks";
import { useToggleProductStock } from "@/hooks/queries/useShopProducts";
import { ImageUtils } from "@/lib/utils";
import { SerializedProduct } from "@/types/product.types";

interface OwnerProductActionsProps {
  product: SerializedProduct;
  onDelete: (product_id: string, image_key: string) => Promise<void>;
}

export function OwnerProductActions({
  product,
  onDelete,
}: OwnerProductActionsProps) {
  const {
    suggestions: categorySuggestions,
    isLoadingSuggestions: isLoadingCategorySuggestions,
    onSearchQuery: onSearchCategoryQuery,
  } = useCategorySearch();
  const {
    suggestions: brandSuggestions,
    isLoadingSuggestions: isLoadingBrandSuggestions,
    onSearchQuery: onSearchBrandQuery,
  } = useBrandSearch();

  const { form, state, handlers, isDialogOpen, setIsDialogOpen } =
    useUpdateProductForm({ product });

  const toggleStock = useToggleProductStock();
  const inStock = product.stock_quantity > 0;
  const isDisabled = state.isLoading || (state.isSubmitting ?? false);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between w-full p-2 border rounded-xl bg-card">
        <InlinePriceEdit productId={product.id} price={product.price} />
        <div className="flex items-center gap-2">
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
      </div>

      <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Button
          variant="outline"
          className="w-full transition-transform duration-200 hover:scale-[1.02]"
          onClick={handlers.openDialog}
        >
          Edit
        </Button>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>Edit product</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ProductDrawerForm
              mode="edit"
              form={form as unknown as UseFormReturn<ProductDrawerFormValues>}
              isDisabled={isDisabled}
              categorySuggestions={categorySuggestions}
              isLoadingCategorySuggestions={isLoadingCategorySuggestions}
              onSearchCategoryQuery={onSearchCategoryQuery}
              brandSuggestions={brandSuggestions}
              isLoadingBrandSuggestions={isLoadingBrandSuggestions}
              onSearchBrandQuery={onSearchBrandQuery}
              existingImageUrl={
                product.image_key
                  ? ImageUtils.getImageUrl(product.image_key)
                  : undefined
              }
              onSubmit={handlers.onSubmit}
            />
          </div>
        </SheetContent>
      </Sheet>

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
