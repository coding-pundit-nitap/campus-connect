"use client";

import { Plus } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";

import { BulkProductDialog } from "@/components/owned-shop/bulk-product-dialog";
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
import { useBrandSearch, useCategorySearch, useCreateProductForm } from "@/hooks";

export function ShopAction() {
  const { form, state, handlers, isOpen, setIsOpen } = useCreateProductForm();
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

  const isDisabled = state.isLoading || state.isSubmitting;

  return (
    <div className="flex items-center gap-2">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <Button
          className="gap-2 shadow-sm transition-all hover:shadow-md"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">Add Product</span>
        </Button>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Add a product</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ProductDrawerForm
              mode="create"
              form={form as unknown as UseFormReturn<ProductDrawerFormValues>}
              isDisabled={isDisabled}
              categorySuggestions={categorySuggestions}
              isLoadingCategorySuggestions={isLoadingCategorySuggestions}
              onSearchCategoryQuery={onSearchCategoryQuery}
              brandSuggestions={brandSuggestions}
              isLoadingBrandSuggestions={isLoadingBrandSuggestions}
              onSearchBrandQuery={onSearchBrandQuery}
              onSubmit={handlers.onSubmit}
              onSaveAndAddAnother={handlers.onSaveAndAddAnother}
            />
          </div>
        </SheetContent>
      </Sheet>
      <BulkProductDialog onSuccess={() => setIsOpen(false)} />
    </div>
  );
}
