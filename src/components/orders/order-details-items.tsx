"use client";
import { Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrderItemReview } from "@/hooks/queries/useOrderItemReview";
import { ImageUtils } from "@/lib/utils";
import { SerializedOrderItemWithProduct } from "@/types";
import { OrderStatus } from "@/types/prisma.types";

import SharedDialog from "../shared/shared-dialog";
import ReviewForm from "./review-form";

type Props = {
  items: SerializedOrderItemWithProduct[];
  orderStatus: OrderStatus;
};

export default function OrderDetailsItems({ items, orderStatus }: Props) {
  const isCompleted = orderStatus === "COMPLETED";
  const subTotal = items.reduce(
    (sum, item) =>
      sum +
      (item.price - (item.price * (item.product.discount || 0)) / 100) *
        item.quantity,
    0
  );

  return (
    <Card className="col-span-1 py-4">
      <CardHeader>
        <CardTitle className="text-lg">Items ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <OrderDetailsItem
              key={item.id}
              item={item}
              isCompleted={isCompleted}
            />
          ))}
          <div className="flex items-center justify-between pt-2 font-bold">
            <span>Total</span>
            <span>₹{subTotal.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderDetailsItem({
  item,
  isCompleted,
}: {
  item: SerializedOrderItemWithProduct;
  isCompleted: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    data: existingReview,
    isLoading: isLoadingReview,
    refetch,
  } = useOrderItemReview(item.id);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image
            src={ImageUtils.getImageUrl(item.product.image_key)}
            alt={item.product.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold wrap-break-words">
            {item.product.name}
          </h4>
          <p className="text-sm text-muted-foreground">
            {item.quantity} x ₹
            {(
              item.price -
              (item.price * (item.product.discount || 0)) / 100
            ).toFixed(2)}
          </p>
        </div>
        <p className="font-semibold">
          ₹
          {(
            (item.price - (item.price * (item.product.discount || 0)) / 100) *
            item.quantity
          ).toFixed(2)}
        </p>
      </div>
      {isCompleted && (
        <SharedDialog
          showCloseButton={false}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={`${
            existingReview ? "Update" : "Write"
          } Review: ${item.product.name}`}
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              disabled={isLoadingReview}
            >
              <Star className="h-4 w-4" />
              {isLoadingReview
                ? "Loading..."
                : existingReview
                  ? "Update Review"
                  : "Write a Review"}
            </Button>
          }
        >
          <ReviewForm
            key={existingReview?.id || item.id}
            order_item_id={item.id}
            product_id={item.product.id}
            review_id={existingReview?.id}
            initialRating={existingReview?.rating}
            initialComment={existingReview?.comment}
            onSuccess={() => {
              setDialogOpen(false);
              refetch();
            }}
          />
        </SharedDialog>
      )}
      <Separator />
    </div>
  );
}
