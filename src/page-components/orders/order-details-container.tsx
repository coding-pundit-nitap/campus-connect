import { notFound } from "next/navigation";
import React from "react";

import { getOrderByIdAction } from "@/actions";
import OrderDetailsCard from "@/components/orders/order-details-card";

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
    return <OrderDetailsCard order={order} />;
  } catch {
    notFound();
  }
}
