import React from "react";

import { Separator } from "@/components/ui/separator";
import { SerializedOrderWithDetails } from "@/types";
import { OrderStatus } from "@/types/prisma.types";

import OrderDetailsActions from "./order-details-actions";
import OrderDetailsHeader from "./order-details-header";
import OrderDetailsInfo from "./order-details-info";
import OrderDetailsItems from "./order-details-items";

type Props = {
  order: SerializedOrderWithDetails;
};

export default function OrderDetailsCard({ order }: Props) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-lg border bg-card p-4 sm:p-6">
      <OrderDetailsHeader order={order} />
      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <OrderDetailsInfo order={order} />
        <OrderDetailsItems
          items={order.items}
          orderStatus={order.order_status as OrderStatus}
        />
      </div>

      <OrderDetailsActions order={order} />
    </div>
  );
}
