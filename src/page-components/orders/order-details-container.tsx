import { notFound } from "next/navigation";
import React from "react";

import { getOrderByIdAction } from "@/actions";
import OrderDetailsCard from "@/components/orders/order-details-card";
import { SharedCard } from "@/components/shared/shared-card";

type Props = {
  order_id: string;
};

export default async function OrderDetailsContainer({ order_id }: Props) {
  try {
    const response = await getOrderByIdAction(order_id);
    if (!response.success) {
      notFound();
    }
    const order = response.data;
    return (
      <SharedCard
        title="Order Details"
        description={`Order #${order.display_id}`}
        className="gap-0 flex flex-col"
        contentClassName="flex-1 flex flex-col"
      >
        <OrderDetailsCard order={order} />
      </SharedCard>
    );
  } catch {
    notFound();
  }
}
