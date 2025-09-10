import React from "react";

import { ProductEditDialog } from "@/components/owned-shop/product-card/product-edit-dialog";
import { SharedCard } from "@/components/shared/shared-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpdateProductForm } from "@/hooks/useProductForm";
import { productUIServices } from "@/lib/utils-functions/product.utils";
import { SerializedProduct } from "@/types/product.types";

import { ProductCardDetails } from "./product-card-details";
import { ProductCardHeader } from "./product-card-header";

interface ProductCardProps {
  product: SerializedProduct;
  discountedPrice: string;
  productHasDiscount: boolean;
  productHasRating: boolean;
  formattedDate: string;
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
  formattedDate,
  priority = false,
  mode = "user",
  onDelete,
  userActions,
}: ProductCardProps) {
  const isOutOfStock = product.stock_quantity === 0;
  const hasLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const productFormHook = useUpdateProductForm({ product });
  const fields = productUIServices.createProductFormFields();

  const renderUserOverlays = () => (
    <div className="relative">
      <ProductCardHeader product={product} priority={priority} />

      <div className="absolute top-2 space-y-2 left-2 flex flex-col">
        {productHasDiscount && (
          <Badge variant="destructive" className="text-xs font-bold shadow-md">
            -{product.discount}% OFF
          </Badge>
        )}
        {isOutOfStock && (
          <Badge
            variant="outline"
            className="bg-white/90 text-red-600 border-red-200 text-xs font-medium"
          >
            Out of Stock
          </Badge>
        )}
        {hasLowStock && !isOutOfStock && (
          <Badge
            variant="outline"
            className="bg-white/90 text-orange-600 border-orange-200 text-xs font-medium"
          >
            Low Stock
          </Badge>
        )}
      </div>

      {productHasRating && (
        <div className="absolute top-2 right-2">
          <Badge
            variant="default"
            className="bg-white/90 text-gray-800 border-gray-200 text-xs font-medium shadow-md"
          >
            ⭐ {product.rating!.toFixed(1)}
          </Badge>
        </div>
      )}

      {isOutOfStock && (
        <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center">
          <div className="bg-white/95 px-3 py-1 rounded-full border">
            <span className="text-sm font-medium text-gray-700">
              Out of Stock
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderOwnerActions = () => {
    if (!onDelete) return null;

    return (
      <div className="flex flex-col w-full gap-2">
        <ProductEditDialog
          product={product}
          form={productFormHook.form}
          state={productFormHook.state}
          handlers={productFormHook.handlers}
          fields={fields}
          className="w-full hover:scale-105 transition-all duration-200 hover:shadow-md"
          isDialogOpen={productFormHook.isDialogOpen}
          setIsDialogOpen={productFormHook.setIsDialogOpen}
        />
        <Button
          onClick={async () => await onDelete(product.id, product.imageKey)}
          variant="destructive"
          className="w-full hover:scale-105 transition-all duration-200 hover:shadow-md"
        >
          Delete
        </Button>
      </div>
    );
  };

  const getCardClassName = () => {
    if (mode === "user") {
      return "group hover:shadow-xl overflow-hidden border-0 shadow-lg";
    }
    return "group hover:shadow-lg transition-shadow duration-200 overflow-hidden";
  };

  return (
    <div className="relative">
      <SharedCard
        className={getCardClassName()}
        headerClassName="p-0 relative"
        showFooter={true}
        headerContent={
          mode === "user" ? (
            renderUserOverlays()
          ) : (
            <ProductCardHeader product={product} priority={priority} />
          )
        }
        footerContent={mode === "owner" ? renderOwnerActions() : userActions}
      >
        <ProductCardDetails
          product={product}
          discountedPrice={discountedPrice}
          productHasDiscount={productHasDiscount}
          productHasRating={productHasRating}
          formattedDate={formattedDate}
        />
      </SharedCard>
    </div>
  );
}
