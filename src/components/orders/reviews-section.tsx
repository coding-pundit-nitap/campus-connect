import React from "react";

import { SerializedOrderWithDetails } from "@/types";

import Review from "./review";

type Props = {
  order: SerializedOrderWithDetails;
};

export default function ReviewSection({ order }: Props) {
  return (
    <div className="flex flex-row flex-wrap gap-4">
      {order.items.map((item) => (
        <Review key={item.id} item={item} />
      ))}
    </div>
  );
}
