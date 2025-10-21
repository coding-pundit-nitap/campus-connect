import React from "react";

import OrderDetailsPage from "@/page-components/orders/order-details-page";

export default async function Page({
  params,
}: {
  params: Promise<{ order_id: string }>;
}) {
  const { order_id } = await params;

  return <OrderDetailsPage order_id={order_id} />;
}
