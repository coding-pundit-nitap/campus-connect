import React from "react";

import OrderTrackingPage from "@/page-components/orders/order-tracking-page";

export default async function Page({
  params,
}: {
  params: Promise<{ order_id: string }>;
}) {
  const { order_id } = await params;

  return <OrderTrackingPage orderId={order_id} />;
}
