import { format } from "date-fns";
import React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getOrderStatusInfo } from "@/lib/utils-functions/order.utils";
import { SerializedOrderWithDetails } from "@/types";

import OrderCardFooter from "./order-card-footer";

type Props = {
  order: SerializedOrderWithDetails;
};

export default function OrderCard({ order }: Props) {
  const statusInfo = getOrderStatusInfo(order.order_status);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col md:flex-row">
        <div
          className={`
            flex flex-row items-center justify-center gap-4 p-4
            md:w-20 md:flex-col md:justify-start md:gap-2
            ${statusInfo.colorClassName.replace("text-", "bg-")}/10
          `}
        >
          <statusInfo.Icon
            className={`h-8 w-8 flex-shrink-0 ${statusInfo.colorClassName}`}
          />

          <Separator orientation="horizontal" className="flex-1 md:hidden" />

          <Separator
            orientation="vertical"
            className="hidden h-auto flex-1 md:block"
          />

          <span className="text-center text-xs font-bold uppercase">
            {statusInfo.label}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-col md:flex-row min-w-0 flex-1 items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-muted-foreground">
                Order #{order.display_id}
              </p>
              <h3 className="truncate font-semibold text-lg">
                {order.shop.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), "PPp")}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="font-bold text-xl">
                ₹{Number(order.total_price).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.items.length} items
              </p>
            </div>
          </div>
          <Separator className="my-3" />
          <OrderCardFooter orderId={order.id} />
        </div>
      </CardContent>
    </Card>
  );
}
