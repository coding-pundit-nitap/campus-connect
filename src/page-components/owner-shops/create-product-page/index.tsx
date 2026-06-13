"use client";

import { ArrowLeft, Package, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBrandSearch,
  useCategorySearch,
  useCreateProductForm,
} from "@/hooks";

import { BulkImportTab } from "./bulk-import-tab";
import { ProductPreviewCard } from "./product-preview-card";
import { SingleProductForm } from "./single-product-form";

export default function CreateProductPage() {
  const router = useRouter();
  const { form, state, handlers } = useCreateProductForm();
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

  const [
    watchedImage,
    watchedPrice,
    watchedDiscount,
    watchedStockQuantity,
    watchedCategory,
    watchedBrand,
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
      "brand",
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

  const onFormSubmit = async (e: React.SubmitEvent) => {
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
              className="gap-2 rounded-lg text-xs font-bold uppercase tracking-wider py-2 transition-all cursor-pointer data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-violet-600"
            >
              <Package className="h-3.5 w-3.5" />
              Single Product
            </TabsTrigger>
            <TabsTrigger
              value="bulk"
              className="gap-2 rounded-lg text-xs font-bold uppercase tracking-wider py-2 transition-all cursor-pointer data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-violet-500"
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
              <SingleProductForm
                form={form}
                state={state}
                categorySuggestions={categorySuggestions}
                isLoadingCategorySuggestions={isLoadingCategorySuggestions}
                onSearchCategoryQuery={onSearchCategoryQuery}
                brandSuggestions={brandSuggestions}
                isLoadingBrandSuggestions={isLoadingBrandSuggestions}
                onSearchBrandQuery={onSearchBrandQuery}
                price={price}
                discount={discount}
                discountedPrice={discountedPrice}
                hasDiscount={hasDiscount}
                onFormSubmit={onFormSubmit}
              />
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-5">
              <ProductPreviewCard
                imagePreview={imagePreview}
                watchedName={watchedName}
                watchedCategory={watchedCategory}
                watchedBrand={watchedBrand}
                watchedDescription={watchedDescription}
                price={price}
                discountedPrice={discountedPrice}
                hasDiscount={hasDiscount}
                discount={discount}
                stockQuantity={stockQuantity}
              />
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="outline-none">
            <BulkImportTab onSuccess={handleFormSuccess} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
