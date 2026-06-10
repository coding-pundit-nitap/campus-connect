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
      <BackButton
        href="/orders"
        label="Back to Orders"
        className="rounded-xl border border-border/80 bg-card hover:bg-muted shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 px-3.5 py-2 h-auto w-fit font-semibold"
      />
      <OrderDetailsCard order={order} />
    </div>
  );
}
