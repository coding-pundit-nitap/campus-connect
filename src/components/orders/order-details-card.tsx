import React from "react";

import { SerializedOrderWithDetails } from "@/types";

import OrderDetailsActions from "./order-details-actions";
import OrderDetailsHeader from "./order-details-header";
import OrderDetailsInfo from "./order-details-info";
import OrderDetailsItems from "./order-details-items";

type Props = {
  order: SerializedOrderWithDetails;
};

export default function OrderDetailsCard({ order }: Props) {
  return (
    <div className="space-y-6 p-6">
      <OrderDetailsHeader
        order_id={order.display_id}
        orderStatus={order.order_status}
        paymentStatus={order.payment_status}
        paymentMethod={order.payment_method}
        createdAt={order.created_at}
        totalPrice={Number(order.total_price)}
      />

      <OrderDetailsInfo
        shopName={order.shop.name}
        deliveryAddress={order.delivery_address_snapshot}
        requestedDeliveryTime={order.requested_delivery_time}
        estimatedDeliveryTime={order.estimated_delivery_time}
        actualDeliveryTime={order.actual_delivery_time}
      />

      <OrderDetailsItems items={order.items} />

      <OrderDetailsActions
        order={order}
        order_id={order.id}
        orderStatus={order.order_status}
        paymentStatus={order.payment_status}
      />
    </div>
  );
}
