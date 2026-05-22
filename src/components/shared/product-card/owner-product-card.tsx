"use client";

import React from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { SerializedProduct } from "@/types/product.types";

import { OwnerProductActions } from "./owner-product-actions";
import { ProductCardProvider } from "./product-card-context";
import { ProductCardDetails } from "./product-card-details";
import { ProductCardImage } from "./product-card-header";

interface OwnerProductCardProps {
  product: SerializedProduct;
  index: number;
  onDelete: (product_id: string, image_key: string) => Promise<void>;
}

export function OwnerProductCard({
  product,
  index,
  onDelete,
}: OwnerProductCardProps) {
  return (
    <ProductCardProvider product={product} priority={index < 4}>
      <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="p-0">
          <ProductCardImage />
        </CardHeader>
        <CardContent className="p-0">
          <ProductCardDetails />
        </CardContent>
        <CardFooter className="bg-muted/40 p-3">
          <OwnerProductActions product={product} onDelete={onDelete} />
        </CardFooter>
      </Card>
    </ProductCardProvider>
  );
}
