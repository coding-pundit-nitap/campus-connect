import { OrderStatus } from "@prisma/client";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  orderId: string;
  orderDate: Date;
  orderStatus: OrderStatus;
  orderTotal: number;
  orderItemsCount: number;
};

export default function OrderCardHeader({
  orderId,
  orderDate,
  orderStatus,
  orderTotal,
  orderItemsCount,
}: Props) {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return "bg-green-500";
      case OrderStatus.OUT_FOR_DELIVERY:
        return "bg-blue-500";
      case OrderStatus.CANCELLED:
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusText = (status: OrderStatus) => {
    return status.replace("_", " ").toUpperCase();
  };

  return (
    <CardHeader className="items-center justify-between">
      <div>
        <CardTitle>Order #{orderId}</CardTitle>
        <CardDescription>
          {orderDate.toLocaleDateString()} • {orderItemsCount} items{" "}
          {orderItemsCount > 1 ? "s" : ""}• ${orderTotal.toFixed(2)} •{" "}
          {orderStatus}
        </CardDescription>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(orderStatus)}>
          {getStatusText(orderStatus)}
        </Badge>
      </div>
    </CardHeader>
  );
}
