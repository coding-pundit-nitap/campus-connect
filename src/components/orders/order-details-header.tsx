import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { format } from "date-fns";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Props = {
  order_id: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  totalPrice: number;
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "NEW":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "PREPARING":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    case "READY_FOR_PICKUP":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "OUT_FOR_DELIVERY":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100";
    case "COMPLETED":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "CANCELLED":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

const getPaymentStatusColor = (status: PaymentStatus) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "FAILED":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "REFUNDED":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

export default function OrderDetailsHeader({
  order_id,
  orderStatus,
  paymentStatus,
  paymentMethod,
  createdAt,
  totalPrice,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Order #{order_id}</h2>
          <p className="text-sm text-muted-foreground">
            Placed on {format(new Date(createdAt), "PPP 'at' pp")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">₹{totalPrice}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {paymentMethod.toLowerCase().replace("_", " ")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(orderStatus)}>
          {orderStatus.replace("_", " ")}
        </Badge>
        <Badge className={getPaymentStatusColor(paymentStatus)}>
          Payment {paymentStatus.toLowerCase()}
        </Badge>
      </div>

      <Separator />
    </div>
  );
}
