"use client";

import {
  ArrowLeft,
  Eye,
  Minus,
  Package,
  Plus,
  Save,
  Sparkles,
  Store,
  Tag,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";

import { BulkProductDialog } from "@/components/owned-shop/bulk-product-dialog";
import { SharedCategoryInput } from "@/components/shared/category-input/shared-category-input";
import { SharedFileInput } from "@/components/shared/shared-file-input";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategorySearch, useCreateProductForm } from "@/hooks";
import { cn } from "@/lib/cn";
import { sanitizeHTML } from "@/lib/sanitize";

export default function CreateProductPage() {
  const router = useRouter();
  const { form, state, handlers } = useCreateProductForm();
  const { suggestions, isLoadingSuggestions, onSearchQuery } =
    useCategorySearch();

  const [
    watchedImage,
    watchedPrice,
    watchedDiscount,
    watchedStockQuantity,
    watchedCategory,
    watchedName,
    watchedDescription,
  ] = useWatch({
    control: form.control,
    name: [
      "image",
      "price",
      "discount",
      "stock_quantity",
      "category",
      "name",
      "description",
    ],
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      if (watchedImage && watchedImage instanceof File) {
        const url = URL.createObjectURL(watchedImage);
        setImagePreview(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } else {
        setImagePreview(null);
      }
    }, 0);
  }, [watchedImage]);

  const price = Number(watchedPrice) || 0;
  const discount = Number(watchedDiscount) || 0;
  const discountedPrice =
    discount > 0 ? price - (price * discount) / 100 : price;
  const hasDiscount = discount > 0;
  const stockQuantity = Number(watchedStockQuantity) || 0;

  const handleFormSuccess = () => {
    router.push("/owner-shops/products");
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handlers.onSubmit(e)?.then(() => handleFormSuccess());
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/owner-shops/products">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl border border-border/40 hover:bg-muted/40 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer h-10 w-10 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-foreground">
                Add New Product
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed font-medium">
                Create and publish a new item to your shop's menu catalog.
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-border/40" />

        <Tabs defaultValue="single" className="space-y-6">
          <TabsList className="grid w-full max-w-xs sm:max-w-md grid-cols-2 bg-muted/30 p-1 rounded-xl border border-border/20">
            <TabsTrigger
              value="single"
              className="gap-2 rounded-lg text-xs font-bold uppercase tracking-wider py-2 transition-all cursor-pointer data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
            >
              <Package className="h-3.5 w-3.5" />
              Single Product
            </TabsTrigger>
            <TabsTrigger
              value="bulk"
              className="gap-2 rounded-lg text-xs font-bold uppercase tracking-wider py-2 transition-all cursor-pointer data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-orange-500"
            >
              <Upload className="h-3.5 w-3.5" />
              Bulk Import
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="single"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 outline-none"
          >
            {/* Form Column */}
            <div className="lg:col-span-7">
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
                        Fill in basic details, description, price, and stock
                        levels.
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
                                  disabled={
                                    state.isLoading || state.isSubmitting
                                  }
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
                                  disabled={
                                    state.isLoading || state.isSubmitting
                                  }
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.currentTarget.valueAsNumber;
                                    field.onChange(
                                      Number.isNaN(val) ? "" : val
                                    );
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
                                  disabled={
                                    state.isLoading || state.isSubmitting
                                  }
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.currentTarget.valueAsNumber;
                                    field.onChange(
                                      Number.isNaN(val) ? "" : val
                                    );
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
                                  Save ₹{(price - discountedPrice).toFixed(0)} (
                                  {discount}% off)
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
                                  disabled={
                                    state.isLoading || state.isSubmitting
                                  }
                                  onClick={() => {
                                    const current =
                                      Number(
                                        form.getValues("stock_quantity")
                                      ) || 0;
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
                                  disabled={
                                    state.isLoading || state.isSubmitting
                                  }
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
                                  disabled={
                                    state.isLoading || state.isSubmitting
                                  }
                                  onClick={() => {
                                    const current =
                                      Number(
                                        form.getValues("stock_quantity")
                                      ) || 0;
                                    form.setValue(
                                      "stock_quantity",
                                      current + 1
                                    );
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
                              Upload high resolution JPG, PNG, or WebP up to
                              5MB.
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
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-5">
              <div className="sticky top-8 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 pl-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Eye className="w-3.5 h-3.5" />
                  <span>Real-time Live Preview</span>
                </div>

                <div className="border border-border/30 bg-card/65 backdrop-blur-xl shadow-[4px_4px_0px_0px_rgba(37,99,235,0.12)] hover:shadow-[6px_6px_0px_0px_rgba(249,115,22,0.25)] hover:border-primary/45 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 max-w-sm">
                  {/* Image area */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-tr from-primary/5 to-transparent flex items-center justify-center border-b border-border/50 min-h-[260px]">
                    {imagePreview ? (
                      <div className="relative w-full h-full p-4">
                        <Image
                          src={imagePreview}
                          alt={watchedName || "Product preview"}
                          fill
                          className="object-contain p-4"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground/35 space-y-2">
                        <Package className="w-12 h-12" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-[10px]">
                          No image uploaded
                        </span>
                      </div>
                    )}

                    {/* Badges overlay */}
                    <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10">
                      {hasDiscount && (
                        <Badge className="border border-orange-600/20 bg-orange-500 text-white font-black rounded-md shadow-xs uppercase tracking-wider text-[9px] px-2 py-0.5">
                          -{discount}%
                        </Badge>
                      )}
                      {stockQuantity === 0 && (
                        <Badge
                          variant="secondary"
                          className="shadow-xs font-black rounded-md border border-border bg-card text-foreground text-[9px] tracking-wider uppercase px-2 py-0.5"
                        >
                          Out of Stock
                        </Badge>
                      )}
                      {stockQuantity > 0 && stockQuantity <= 5 && (
                        <Badge
                          variant="secondary"
                          className="border border-red-500/20 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[9px] tracking-wider uppercase px-2 py-0.5 animate-pulse"
                        >
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    {stockQuantity === 0 && (
                      <div className="absolute inset-0 bg-white/40 dark:bg-black/50 backdrop-blur-[1px] pointer-events-none" />
                    )}
                  </div>

                  {/* Details area */}
                  <div className="p-5 space-y-4 flex flex-col justify-between flex-1">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {watchedCategory ? (
                            <Badge
                              variant="outline"
                              className="bg-indigo-500/5 text-indigo-600 border border-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/25 font-semibold text-[11px] rounded-full px-2.5 py-0.5"
                            >
                              {watchedCategory}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 italic font-medium">
                              Uncategorized
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded-md">
                            <Store className="w-3.5 h-3.5 text-orange-500" />
                            <span className="truncate max-w-[80px]">
                              Your Shop
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="truncate font-heading font-black tracking-tight leading-tight text-foreground text-lg">
                          {watchedName || "Product Name Preview"}
                        </h3>
                        {watchedDescription ? (
                          <div
                            className="min-h-10 text-xs leading-relaxed text-muted-foreground line-clamp-2 prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHTML(watchedDescription) || "",
                            }}
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground/50 italic line-clamp-2 min-h-10 leading-relaxed font-medium">
                            Describe the item on the left to see the text mockup
                            here...
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-black tracking-tight text-foreground text-2xl">
                          ₹{discountedPrice.toFixed(0)}
                        </span>
                        {hasDiscount && (
                          <>
                            <span className="text-muted-foreground/60 font-semibold line-through text-sm">
                              ₹{price}
                            </span>
                            <Badge
                              variant="destructive"
                              className="border-none bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 shadow-xs text-[10px] px-2 py-0.5 font-bold rounded-full"
                            >
                              {discount}% OFF
                            </Badge>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-muted-foreground/80 border-t border-muted/35 pt-3 text-xs font-medium">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0 shadow-xs",
                            stockQuantity === 0
                              ? "bg-rose-500 dark:bg-rose-400"
                              : stockQuantity <= 5
                                ? "bg-amber-500 dark:bg-amber-400 animate-pulse"
                                : "bg-emerald-500 dark:bg-emerald-400"
                          )}
                        />
                        <span
                          className={cn(
                            stockQuantity === 0
                              ? "text-rose-600 dark:text-rose-400"
                              : stockQuantity <= 5
                                ? "text-amber-500 dark:text-amber-400 font-bold"
                                : "text-emerald-600 dark:text-emerald-400 font-medium"
                          )}
                        >
                          {stockQuantity === 0
                            ? "Out of Stock"
                            : stockQuantity <= 5
                              ? "Low Stock"
                              : "In Stock"}
                        </span>
                        <span className="text-[10px] opacity-75">
                          ({stockQuantity} left)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="outline-none">
            <div className="bg-card/45 backdrop-blur-xl rounded-2xl border border-border/30 shadow-xl overflow-hidden relative max-w-4xl">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-foreground">
                      Bulk Import Products
                    </h2>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Upload a CSV file with your product data to add multiple
                      items at once.
                    </p>
                  </div>
                </div>

                <Separator className="bg-border/40" />

                <div className="space-y-6">
                  <div className="text-center py-10 px-4 border-2 border-dashed rounded-2xl border-border/60 hover:border-orange-500/50 bg-muted/15 transition-all duration-300">
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                    <h3 className="text-base font-bold mb-1.5 text-foreground">
                      Import Products from CSV
                    </h3>
                    <p className="text-xs text-muted-foreground mb-6 max-w-xs mx-auto leading-relaxed font-medium">
                      Upload a CSV file containing your product information. You
                      can use our official template to match columns.
                    </p>
                    <div className="flex justify-center">
                      <BulkProductDialog
                        onSuccess={() => handleFormSuccess()}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-500/[0.02] border border-blue-500/10 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      CSV Columns & Format Guide
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1 bg-card/40 border border-border/20 p-3 rounded-xl">
                        <span className="font-bold text-foreground">
                          Required Headers
                        </span>
                        <ul className="text-muted-foreground space-y-1 mt-1 leading-relaxed font-medium">
                          <li>
                            • <strong className="text-foreground">name</strong>:
                            The product display title (string)
                          </li>
                          <li>
                            • <strong className="text-foreground">price</strong>
                            : Base pricing in Rupees (numeric)
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-1 bg-card/40 border border-border/20 p-3 rounded-xl">
                        <span className="font-bold text-foreground">
                          Optional Headers
                        </span>
                        <ul className="text-muted-foreground space-y-1 mt-1 leading-relaxed font-medium">
                          <li>
                            •{" "}
                            <strong className="text-foreground">
                              description
                            </strong>
                            : Text details / ingredients
                          </li>
                          <li>
                            •{" "}
                            <strong className="text-foreground">
                              stock_quantity
                            </strong>
                            : Initial stock (integer)
                          </li>
                          <li>
                            •{" "}
                            <strong className="text-foreground">
                              discount
                            </strong>
                            : Promo off percentage (0-100)
                          </li>
                          <li>
                            •{" "}
                            <strong className="text-foreground">
                              category
                            </strong>
                            : Menu category tag
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
