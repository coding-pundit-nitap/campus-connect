import { Package, Star } from "lucide-react";
import Image from "next/image";
import React from "react";

import { ImageUtils } from "@/lib/utils";
import { SerializedOrderItemWithProduct } from "@/types";

import SharedDialog from "../shared/shared-dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import ReviewForm from "./review-form";

type Props = {
  item: SerializedOrderItemWithProduct;
};

export default function Review({ item }: Props) {
  return (
    <Card className="py-4 w-fit">
      <CardContent className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="relative h-20 w-20 lg:h-24 lg:w-24 overflow-hidden shrink-0">
          {item.product.image_key ? (
            <Image
              src={ImageUtils.getImageUrl(item.product.image_key)}
              alt={item.product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <h4 className="font-semibold  text-lg leading-tight mb-1">
              {item.product.name}
            </h4>
            {item.product.description && (
              <p className="text-sm line-clamp-2 leading-relaxed">
                {item.product.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
              <span className="font-medium">Qty:</span>
              <span>{item.quantity}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md">
              <span className="font-medium">₹{item.price}</span>
              <span className="text-xs">each</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4 lg:min-w-[140px]">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide mb-1">Total</p>
            <p className="text-2xl font-bold">
              ₹{(item.price * item.quantity).toFixed(2)}
            </p>
          </div>

          <SharedDialog
            showCloseButton={false}
            title={`Write a Review for ${item.product.name}`}
            trigger={
              <Button variant="outline" className="w-full lg:w-auto">
                <Star className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            }
          >
            <ReviewForm order_item_id={item.id} product_id={item.product.id} />
          </SharedDialog>
        </div>
      </CardContent>
    </Card>
  );
}
