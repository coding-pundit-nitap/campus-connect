import { Calendar, Package, User } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getOrderStatusInfo } from "@/lib/utils/order.utils";
import { SerializedOrderWithDetails } from "@/types";

type Props = {
  order: SerializedOrderWithDetails;
  isSelected: boolean;
  onSelectionChange: (orderId: string, isSelected: boolean) => void;
  lastElementRef?: (node: HTMLDivElement | null) => void;
};

export default function OrderCard({
  order,
  isSelected,
  onSelectionChange,
  lastElementRef,
}: Props) {
  const statusInfo = getOrderStatusInfo(order.order_status);

  const subtotal = order.items.reduce((acc, item) => {
    return (
      acc +
      (item.price - (item.price * (item.product.discount || 0)) / 100) *
        item.quantity
    );
  }, 0);

  return (
    <Card
      ref={lastElementRef}
      className={`transition-shadow hover:shadow-md ${isSelected ? "border-primary bg-primary/5" : ""}`}
    >
      <CardContent className="flex  gap-4 p-4">
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelectionChange(order.id, e.target.checked)}
          aria-label={`Select order ${order.display_id}`}
        />

        <div className="flex flex-col md:flex-row items-center w-full justify-between">
          <div className="md:flex-1 flex flex-col text-sm">
            <div className="flex flex-col">
              <span className="font-bold text-base">#{order.display_id}</span>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>
                {order.items.length}{" "}
                {order.items.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold ${statusInfo.colorClassName}`}
            >
              <statusInfo.Icon className="h-4 w-4" />
              <span>{statusInfo.label}</span>
            </div>
            <p className="font-bold text-lg">₹{subtotal.toFixed(2)}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/owner-shops/orders/${order.id}`}>Details</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
