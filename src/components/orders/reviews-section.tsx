import { Star } from "lucide-react";
import React from "react";

import { SerializedOrderWithDetails } from "@/types";

import Review from "./review";

type Props = {
  order: SerializedOrderWithDetails;
};

export default function ReviewSection({ order }: Props) {
  const reviewableItems = order.items.filter(
    (item) => item.product && item.product.id
  );

  if (reviewableItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No items available for review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rate Your Products</h3>
        <p className="text-sm text-muted-foreground">
          {reviewableItems.length} item{reviewableItems.length !== 1 ? "s" : ""}{" "}
          to review
        </p>
      </div>
      <div className="grid gap-4">
        {reviewableItems.map((item) => (
          <Review key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
