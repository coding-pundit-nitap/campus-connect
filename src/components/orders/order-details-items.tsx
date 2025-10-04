import Image from "next/image";
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageUtils } from "@/lib/utils-functions";
import { SerializedOrderItem } from "@/types";
import { SerializedProduct } from "@/types/product.types";

type OrderItemWithProduct = SerializedOrderItem & {
  product: SerializedProduct;
};

type Props = {
  items: OrderItemWithProduct[];
};

export default function OrderDetailsItems({ items }: Props) {
  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle className="text-lg">Order Items ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id}>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100">
                  {item.product.imageKey ? (
                    <Image
                      src={ImageUtils.getImageUrl(item.product.imageKey)}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  {item.product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.product.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      ₹{item.price} each
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>

              {index < items.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}

          <Separator />

          <div className="flex items-center justify-between font-semibold">
            <span>Total Amount</span>
            <span className="text-lg">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
