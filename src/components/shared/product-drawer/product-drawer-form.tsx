"use client";

import { Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

import {
  fieldInputClass,
  primaryButtonClass,
  sectionLabelClass,
} from "@/components/shared/form-styles";
import { SharedCategoryInput } from "@/components/shared/category-input/shared-category-input";
import { SharedFileInput } from "@/components/shared/shared-file-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

import { ProductDrawerPreview } from "./product-drawer-preview";

/**
 * Loosened shape both ProductActionFormData (create) and
 * ProductUpdateActionFormData (edit) are structurally compatible with —
 * `image` is optional here because it's only required by the create schema,
 * not the edit one. Call sites cast their real, schema-validated form into
 * this shape with `as unknown as UseFormReturn<ProductDrawerFormValues>` so
 * this one component can drive both the create and edit drawers.
 */
export interface ProductDrawerFormValues {
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  discount?: number;
  category?: string;
  brand?: string;
  image?: File;
  image_key?: string;
}

interface CategorySuggestion {
  id: string;
  title: string;
  subtitle: string;
}

export interface ProductDrawerFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<ProductDrawerFormValues>;
  isDisabled: boolean;
  categorySuggestions: CategorySuggestion[];
  isLoadingCategorySuggestions: boolean;
  onSearchCategoryQuery: (query: string) => void;
  brandSuggestions: CategorySuggestion[];
  isLoadingBrandSuggestions: boolean;
  onSearchBrandQuery: (query: string) => void;
  existingImageUrl?: string;
  onSubmit: (e?: React.BaseSyntheticEvent) => void | Promise<void>;
  onSaveAndAddAnother?: () => void;
}

export function ProductDrawerForm({
  mode,
  form,
  isDisabled,
  categorySuggestions,
  isLoadingCategorySuggestions,
  onSearchCategoryQuery,
  brandSuggestions,
  isLoadingBrandSuggestions,
  onSearchBrandQuery,
  existingImageUrl,
  onSubmit,
  onSaveAndAddAnother,
}: ProductDrawerFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    existingImageUrl ?? null
  );

  const [watchedImage, watchedPrice, watchedDiscount, watchedStock, watchedName, watchedCategory, watchedBrand, watchedDescription] =
    useWatch({
      control: form.control,
      name: [
        "image",
        "price",
        "discount",
        "stock_quantity",
        "name",
        "category",
        "brand",
        "description",
      ],
    });

  useEffect(() => {
    if (watchedImage instanceof File) {
      const url = URL.createObjectURL(watchedImage);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setImagePreview(existingImageUrl ?? null);
  }, [watchedImage, existingImageUrl]);

  const price = Number(watchedPrice) || 0;
  const discount = Number(watchedDiscount) || 0;
  const discountedPrice = discount > 0 ? price - (price * discount) / 100 : price;

  return (
    <div className="space-y-6">
      <ProductDrawerPreview
        imagePreview={imagePreview}
        watchedName={watchedName || ""}
        watchedCategory={watchedCategory || ""}
        watchedBrand={watchedBrand || ""}
        watchedDescription={watchedDescription}
        price={price}
        discountedPrice={discountedPrice}
        hasDiscount={discount > 0}
        discount={discount}
        stockQuantity={Number(watchedStock) || 0}
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={sectionLabelClass}>
                  Product Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="E.g., Double Cheese Pizza"
                    className={fieldInputClass}
                    disabled={isDisabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={sectionLabelClass}>
                    Category
                  </FormLabel>
                  <FormControl>
                    <SharedCategoryInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Beverages, Mains..."
                      disabled={isDisabled}
                      suggestions={categorySuggestions}
                      isLoadingSuggestions={isLoadingCategorySuggestions}
                      onSearchQuery={onSearchCategoryQuery}
                      className={fieldInputClass}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={sectionLabelClass}>Brand</FormLabel>
                  <FormControl>
                    <SharedCategoryInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Classmate, Snickers..."
                      disabled={isDisabled}
                      suggestions={brandSuggestions}
                      isLoadingSuggestions={isLoadingBrandSuggestions}
                      onSearchQuery={onSearchBrandQuery}
                      className={fieldInputClass}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={sectionLabelClass}>
                  Price (₹)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    className={fieldInputClass}
                    disabled={isDisabled}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.currentTarget.valueAsNumber;
                      field.onChange(Number.isNaN(val) ? "" : val);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={sectionLabelClass}>
                  Product Image
                </FormLabel>
                <FormControl>
                  <SharedFileInput
                    value={field.value}
                    onChange={(file) => field.onChange(file ?? undefined)}
                    accept="image/*"
                    maxSize={5}
                    disabled={isDisabled}
                    previewUrl={existingImageUrl}
                    placeholder="Drag and drop, or click to upload"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Accordion type="single" collapsible>
            <AccordionItem value="more-details" className="border-none">
              <AccordionTrigger className="rounded-lg border border-border/50 px-4 py-2.5 text-sm font-semibold hover:no-underline">
                More details (description, discount, stock)
              </AccordionTrigger>
              <AccordionContent className="space-y-5 px-1 pt-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={sectionLabelClass}>
                        Description
                      </FormLabel>
                      <FormControl>
                        <div className="overflow-hidden rounded-lg border border-border/50 transition-colors focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10">
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="Ingredients, taste, size..."
                            disabled={isDisabled}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={sectionLabelClass}>
                          Discount (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="0"
                            className={fieldInputClass}
                            disabled={isDisabled}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.currentTarget.valueAsNumber;
                              field.onChange(Number.isNaN(val) ? "" : val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={sectionLabelClass}>
                          Stock Quantity
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            className={fieldInputClass}
                            disabled={isDisabled}
                            {...field}
                            onChange={(e) => {
                              const val = e.currentTarget.valueAsNumber;
                              field.onChange(Number.isNaN(val) ? 0 : val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            {mode === "create" && onSaveAndAddAnother && (
              <Button
                type="button"
                variant="outline"
                disabled={isDisabled}
                className="h-12 flex-1 rounded-xl font-semibold"
                onClick={onSaveAndAddAnother}
              >
                Save & add another
              </Button>
            )}
            <Button
              type="submit"
              disabled={isDisabled}
              className={`h-12 flex-1 gap-2 ${primaryButtonClass}`}
            >
              <Save className="h-4 w-4" />
              {isDisabled
                ? "Saving..."
                : mode === "create"
                  ? "Save product"
                  : "Save changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
