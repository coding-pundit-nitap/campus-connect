import { CheckCircle2, Package, Star } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

import { ImageUtils } from "@/lib/utils";
import { SerializedOrderItemWithProduct } from "@/types";

import SharedDialog from "../shared/shared-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import ReviewForm from "./review-form";

type Props = {
  item: SerializedOrderItemWithProduct;
  hasReview?: boolean;
};

export default function Review({ item, hasReview = false }: Props) {
  const [isReviewed, setIsReviewed] = useState<boolean>(hasReview);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const handleReviewSuccess = () => {
    setIsReviewed(true);
    setDialogOpen(false);
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-32 sm:h-auto sm:w-32 shrink-0 bg-muted">
            {item.product.image_key ? (
              <Image
                src={ImageUtils.getImageUrl(item.product.image_key)}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-32">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-2">
                <h4 className="font-semibold text-base leading-tight line-clamp-2">
                  {item.product.name}
                </h4>
                {isReviewed && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Reviewed
                  </Badge>
                )}
              </div>

              {item.product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {item.product.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="font-normal">
                  Qty: {item.quantity}
                </Badge>
                <Badge variant="outline" className="font-normal">
                  ₹{item.price} each
                </Badge>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:min-w-[140px]">
              <div className="text-left sm:text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total
                </p>
                <p className="text-xl font-bold">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>

              <SharedDialog
                showCloseButton={false}
                title="Write a Review"
                description={`Share your experience with ${item.product.name}`}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                trigger={
                  <Button
                    variant={isReviewed ? "outline" : "default"}
                    size="sm"
                    className="gap-2 shrink-0"
                  >
                    <Star
                      className={`h-4 w-4 ${isReviewed ? "" : "fill-current"}`}
                    />
                    {isReviewed ? "Edit Review" : "Write Review"}
                  </Button>
                }
              >
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4">
                  <div className="relative h-12 w-12 rounded-md overflow-hidden shrink-0 bg-muted">
                    {item.product.image_key ? (
                      <Image
                        src={ImageUtils.getImageUrl(item.product.image_key)}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                </div>

                <ReviewForm
                  order_item_id={item.id}
                  product_id={item.product.id}
                  onSuccess={handleReviewSuccess}
                />
              </SharedDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
