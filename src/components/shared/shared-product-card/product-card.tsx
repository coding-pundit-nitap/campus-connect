import Link from "next/link";
import React from "react";

import { ProductEditDialog } from "@/components/owned-shop/product-card/product-edit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useCategorySearch } from "@/hooks";
import { useUpdateProductForm } from "@/hooks/useProductForm";
import { ImageUtils } from "@/lib/utils-functions";
import { productUIServices } from "@/lib/utils-functions/product.utils";
import { SerializedProduct } from "@/types/product.types";

import { ProductCardDetails } from "./product-card-details";
import { ProductCardHeader } from "./product-card-header";

interface ProductCardProps {
  product: SerializedProduct;
  discountedPrice: string;
  productHasDiscount: boolean;
  productHasRating: boolean;
  priority?: boolean;
  mode?: "user" | "owner";
  onDelete?: (product_id: string, imageKey: string) => Promise<void>;
  userActions?: React.ReactNode;
}

export function ProductCard({
  product,
  discountedPrice,
  productHasDiscount,
  productHasRating,
  priority = false,
  mode = "user",
  onDelete,
  userActions,
}: ProductCardProps) {
  const isOutOfStock = product.stock_quantity === 0;
  const hasLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const { suggestions, isLoadingSuggestions, onSearchQuery } =
    useCategorySearch();
  const productFormHook = useUpdateProductForm({ product });
  const baseFields = productUIServices.createProductFormFields();
  const fields = baseFields.map((field) => {
    if (field.name === "category") {
      return { ...field, suggestions, isLoadingSuggestions, onSearchQuery };
    }
    if (field.name === "image" && product.imageKey) {
      return {
        ...field,
        previewUrl: ImageUtils.getImageUrl(product.imageKey),
      };
    }
    return field;
  });

  const renderOwnerActions = () => {
    if (!onDelete) {
      return null;
    }
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
          onClick={() => onDelete(product.id, product.imageKey)}
          variant="destructive"
          className="w-full transition-transform duration-200 hover:scale-[1.02]"
        >
          Delete
        </Button>
      </div>
    );
  };

  if (mode === "owner") {
    return (
      <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="p-0">
          <ProductCardHeader product={product} priority={priority} />
        </CardHeader>
        <CardContent className="p-0">
          <ProductCardDetails
            product={product}
            discountedPrice={discountedPrice}
            productHasDiscount={productHasDiscount}
            productHasRating={productHasRating}
          />
        </CardContent>
        <CardFooter className="bg-muted/40 p-3">
          {renderOwnerActions()}
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow duration-300 hover:shadow-xl">
      {/* Mobile: Horizontal list layout */}
      <Link href={`/product/${product.id}`} className="flex md:hidden h-36">
        <div className="relative w-24 shrink-0 h-full">
          <ProductCardHeader
            product={product}
            priority={priority}
            isMobileList
          />
        </div>
        <div className="flex  md:flex-col h-full justify-between flex-1">
          <ProductCardDetails
            product={product}
            discountedPrice={discountedPrice}
            productHasDiscount={productHasDiscount}
            productHasRating={productHasRating}
            isMobileList
          />
          <div className="p-2">{userActions}</div>
        </div>
      </Link>

      {/* Desktop: Vertical card layout */}
      <div className="hidden md:block">
        <div className="relative">
          <ProductCardHeader product={product} priority={priority} />
          <>
            <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
              {productHasDiscount && (
                <Badge className="border-none bg-red-500 text-white shadow-lg">
                  -{product.discount}% OFF
                </Badge>
              )}
              {isOutOfStock && (
                <Badge variant="secondary" className="shadow-lg">
                  Out of Stock
                </Badge>
              )}
              {hasLowStock && !isOutOfStock && (
                <Badge
                  variant="secondary"
                  className="border-orange-200 text-orange-600 shadow-lg"
                >
                  Low Stock
                </Badge>
              )}
            </div>
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 dark:bg-black/60" />
            )}
          </>
        </div>

        <ProductCardDetails
          product={product}
          discountedPrice={discountedPrice}
          productHasDiscount={productHasDiscount}
          productHasRating={productHasRating}
        />

        <CardFooter className="p-4 pt-2 md:absolute md:bottom-0 md:left-0 md:w-full md:translate-y-full md:transform-gpu md:bg-linear-to-t md:from-white md:via-white/90 md:to-transparent md:p-4 md:pt-12 md:transition-transform md:duration-300 md:ease-in-out md:group-hover:translate-y-0 dark:md:from-black flex items-center justify-center dark:md:via-black/90">
          {userActions}
        </CardFooter>
      </div>
    </div>
  );
}
