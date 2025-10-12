import { OrderStatus } from "@prisma/client";
import { Star } from "lucide-react";
import Image from "next/image";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageUtils } from "@/lib/utils-functions";
import { SerializedOrderItemWithProduct } from "@/types";

import SharedDialog from "../shared/shared-dialog";
import ReviewForm from "./review-form";

type Props = {
  items: SerializedOrderItemWithProduct[];
  orderStatus: OrderStatus;
};

export default function OrderDetailsItems({ items, orderStatus }: Props) {
  const isCompleted = orderStatus === "COMPLETED";

  return (
    <Card className="col-span-1 py-4">
      <CardHeader>
        <CardTitle className="text-lg">Items ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={ImageUtils.getImageUrl(item.product.imageKey)}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold break-words">
                    {item.product.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} x ₹{item.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              {isCompleted && (
                <SharedDialog
                  showCloseButton={false}
                  title={`Reviewing: ${item.product.name}`}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Star className="h-4 w-4" /> Write a Review
                    </Button>
                  }
                >
                  <ReviewForm
                    order_item_id={item.id}
                    product_id={item.product.id}
                  />
                </SharedDialog>
              )}
              <Separator />
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 font-bold">
            <span>Total</span>
            <span>
              ₹
              {items
                .reduce((sum, item) => sum + item.price * item.quantity, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
