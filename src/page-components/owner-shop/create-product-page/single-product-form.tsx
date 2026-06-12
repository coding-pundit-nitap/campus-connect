import { Minus, Plus, Save, Sparkles, Tag } from "lucide-react";
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
  suggestions: {
    id: string;
    title: string;
    subtitle: string;
  }[];
  isLoadingSuggestions: boolean;
  onSearchQuery: (query: string) => void;
  price: number;
  discount: number;
  discountedPrice: number;
  hasDiscount: boolean;
  onFormSubmit: (e: React.FormEvent) => void;
}

export function SingleProductForm({
  form,
  state,
  suggestions,
  isLoadingSuggestions,
  onSearchQuery,
  price,
  discount,
  discountedPrice,
  hasDiscount,
  onFormSubmit,
}: SingleProductFormProps) {
  return (
    <div className="bg-card/45 backdrop-blur-xl rounded-2xl border border-border/30 shadow-xl shadow-blue-500/[0.01] overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Product Details
            </h2>
            <p className="text-[11px] text-muted-foreground font-medium">
              Fill in basic details, description, price, and stock levels.
            </p>
          </div>
        </div>

        <Separator className="bg-border/40" />

        {state.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl font-medium">
            {state.error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={onFormSubmit} className="space-y-5">
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
                      className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold text-sm"
                      disabled={state.isLoading || state.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      disabled={state.isLoading || state.isSubmitting}
                      suggestions={suggestions}
                      isLoadingSuggestions={isLoadingSuggestions}
                      onSearchQuery={onSearchQuery}
                      className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold text-sm"
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
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Description
                  </FormLabel>
                  <FormControl>
                    <div className="focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 rounded-xl overflow-hidden border border-border/50 transition-all duration-300">
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Describe the ingredients, taste, size, preparation details..."
                        disabled={state.isLoading || state.isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                        disabled={state.isLoading || state.isSubmitting}
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
                        className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                        disabled={state.isLoading || state.isSubmitting}
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

            {price > 0 && (
              <div className="bg-blue-500/[0.03] dark:bg-blue-500/[0.01] border border-blue-500/10 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground/80 font-semibold">
                    Customer Price Result
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-foreground">
                      ₹{discountedPrice.toFixed(0)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        Save ₹{(price - discountedPrice).toFixed(0)} ({discount}
                        % off)
                      </span>
                    )}
                  </div>
                </div>
                <Tag className="w-5 h-5 text-blue-600/60" />
              </div>
            )}

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
                        className="h-11 w-11 rounded-xl border border-border/50 hover:bg-muted/40 cursor-pointer shrink-0"
                        disabled={state.isLoading || state.isSubmitting}
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
                        className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-center text-sm w-28"
                        disabled={state.isLoading || state.isSubmitting}
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
                        className="h-11 w-11 rounded-xl border border-border/50 hover:bg-muted/40 cursor-pointer shrink-0"
                        disabled={state.isLoading || state.isSubmitting}
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
                      disabled={state.isLoading || state.isSubmitting}
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

            <Button
              type="submit"
              disabled={state.isLoading || state.isSubmitting}
              className="w-full h-11 px-6 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 text-white shadow-lg shadow-orange-500/15 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none border-none cursor-pointer text-xs mt-3 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {state.isLoading || state.isSubmitting
                ? "Saving product..."
                : "Save & Add Product"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
