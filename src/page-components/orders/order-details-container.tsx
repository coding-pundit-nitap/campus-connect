import { notFound } from "next/navigation";
import React from "react";

import { getOrderByIdAction } from "@/actions";
import OrderDetailsCard from "@/components/orders/order-details-card";
import { BackButton } from "@/components/shared/back-button";

type Props = {
  order_id: string;
};

export default async function OrderDetailsContainer({ order_id }: Props) {
  let order;

  try {
    const response = await getOrderByIdAction(order_id);
    if (!response.success) {
      notFound();
    }
    order = response.data;
  } catch {
    notFound();
  }

  return (
    <div className="container py-6 space-y-4">
      <BackButton href="/orders" label="Back to Orders" />
      <OrderDetailsCard order={order} />
    </div>
  );
}
