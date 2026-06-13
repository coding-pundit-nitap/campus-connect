import { Minus, Package, Plus, Save, Tag } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";

import { SharedCategoryInput } from "@/components/shared/category-input/shared-category-input";
import { SharedFileInput } from "@/components/shared/shared-file-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Separator } from "@/components/ui/separator";
import { ProductActionFormData } from "@/validations";

interface SingleProductFormProps {
  form: UseFormReturn<ProductActionFormData>;
  state: {
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
  };
  categorySuggestions: {
    id: string;
    title: string;
    subtitle: string;
  }[];
  isLoadingCategorySuggestions: boolean;
  onSearchCategoryQuery: (query: string) => void;
  brandSuggestions: {
    id: string;
    title: string;
    subtitle: string;
  }[];
  isLoadingBrandSuggestions: boolean;
  onSearchBrandQuery: (query: string) => void;
  price: number;
  discount: number;
  discountedPrice: number;
  hasDiscount: boolean;
  onFormSubmit: (e: React.SubmitEvent) => void;
}

const inputClass =
  "h-11 bg-muted/20 border-border/50 hover:border-violet-400/50 focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold text-sm";

export function SingleProductForm({
  form,
  state,
  categorySuggestions,
  isLoadingCategorySuggestions,
  onSearchCategoryQuery,
  brandSuggestions,
  isLoadingBrandSuggestions,
  onSearchBrandQuery,
  price,
  discount,
  discountedPrice,
  hasDiscount,
  onFormSubmit,
}: SingleProductFormProps) {
  const isDisabled = state.isLoading || state.isSubmitting;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl shadow-violet-500/[0.04]">
      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500" />

      <div className="p-6 sm:p-8 space-y-6">
        {/* Section header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Product Details
            </h2>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              Fill in basic details, description, price, and stock levels.
            </p>
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* Error banner */}
        {state.error ? (
          <div className="flex items-start gap-2.5 p-3.5 bg-destructive/8 border border-destructive/20 text-destructive text-xs rounded-xl font-medium">
            <span className="shrink-0 mt-0.5">⚠</span>
            {state.error}
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={onFormSubmit} className="space-y-5">
            {/* Product Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Product Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="E.g., Double Cheese Pizza, Ice Latte"
                      className={inputClass}
                      disabled={isDisabled}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Category
                  </FormLabel>
                  <FormControl>
                    <SharedCategoryInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="E.g., Beverages, Mains, Desserts..."
                      disabled={isDisabled}
                      suggestions={categorySuggestions}
                      isLoadingSuggestions={isLoadingCategorySuggestions}
                      onSearchQuery={onSearchCategoryQuery}
                      className={inputClass}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] text-muted-foreground/80 font-medium">
                    Type to search or create a new category.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Brand
                  </FormLabel>
                  <FormControl>
                    <SharedCategoryInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="E.g., Classmate,Snickers, ..."
                      disabled={isDisabled}
                      suggestions={brandSuggestions}
                      isLoadingSuggestions={isLoadingBrandSuggestions}
                      onSearchQuery={onSearchBrandQuery}
                      className={inputClass}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] text-muted-foreground/80 font-medium">
                    Type to search or create a new Brand.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Description
                  </FormLabel>
                  <FormControl>
                    <div className="focus-within:border-violet-600 focus-within:ring-2 focus-within:ring-violet-600/10 rounded-xl overflow-hidden border border-border/50 transition-all duration-300">
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Describe the ingredients, taste, size, preparation details..."
                        disabled={isDisabled}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price + Discount row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Base Price (₹)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        className={inputClass}
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
                name="discount"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Discount Percentage (%)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0"
                        className={inputClass}
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
            </div>

            {/* Price preview */}
            {price > 0 ? (
              <div className="bg-violet-500/[0.04] dark:bg-violet-500/[0.03] border border-violet-500/15 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground/80 font-semibold">
                    Customer Price Result
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-foreground">
                      ₹{discountedPrice.toFixed(0)}
                    </span>
                    {hasDiscount ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        Save ₹{(price - discountedPrice).toFixed(0)} ({discount}
                        % off)
                      </span>
                    ) : null}
                  </div>
                </div>
                <Tag className="w-5 h-5 text-violet-600/60" />
              </div>
            ) : null}

            {/* Stock Quantity */}
            <FormField
              control={form.control}
              name="stock_quantity"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Initial Stock Quantity
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-xl border border-border/50 hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-950/20 dark:hover:border-violet-800 cursor-pointer shrink-0 transition-all duration-200"
                        disabled={isDisabled}
                        onClick={() => {
                          const current =
                            Number(form.getValues("stock_quantity")) || 0;
                          form.setValue(
                            "stock_quantity",
                            Math.max(0, current - 1)
                          );
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        className="h-11 bg-muted/20 border-border/50 hover:border-violet-400/50 focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 rounded-xl transition-all duration-300 font-semibold text-center text-sm w-28"
                        disabled={isDisabled}
                        {...field}
                        onChange={(e) => {
                          const val = e.currentTarget.valueAsNumber;
                          field.onChange(Number.isNaN(val) ? 0 : val);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-xl border border-border/50 hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-950/20 dark:hover:border-violet-800 cursor-pointer shrink-0 transition-all duration-200"
                        disabled={isDisabled}
                        onClick={() => {
                          const current =
                            Number(form.getValues("stock_quantity")) || 0;
                          form.setValue("stock_quantity", current + 1);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Image */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Product Image
                  </FormLabel>
                  <FormControl>
                    <SharedFileInput
                      value={field.value}
                      onChange={(file) => field.onChange(file)}
                      accept="image/*"
                      maxSize={5}
                      disabled={isDisabled}
                      placeholder="Drag and drop your image, or click to upload"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] text-muted-foreground/80 font-medium">
                    Upload high resolution JPG, PNG, or WebP up to 5MB.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              disabled={isDisabled}
              className="w-full h-12 px-6 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 text-white shadow-lg shadow-violet-500/20 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none border-none cursor-pointer text-xs mt-3 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isDisabled ? "Saving product..." : "Save & Add Product"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
