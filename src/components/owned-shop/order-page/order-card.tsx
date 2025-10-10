import { OrderStatus } from "@prisma/client";
import { Package, User } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils-functions/date";
import { SerializedOrderWithDetails } from "@/types";

type Props = {
  order: SerializedOrderWithDetails;
  isSelected: boolean;
  onSelectionChange: (orderId: string, isSelected: boolean) => void;
  lastElementRef?: (node: HTMLDivElement | null) => void;
};

const statusVariantMap: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  NEW: "secondary",
  PREPARING: "secondary",
  READY_FOR_PICKUP: "outline",
  OUT_FOR_DELIVERY: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

const OrderCard = ({
  order,
  isSelected,
  onSelectionChange,
  lastElementRef,
}: Props) => {
  return (
    <Card ref={lastElementRef}>
      <CardContent className="p-4 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <div className="flex items-center h-full">
          <Checkbox
            checked={isSelected}
            onChange={(e) => onSelectionChange(order.id, e.target.checked)}
            aria-label={`Select order ${order.display_id}`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="font-bold text-base">#{order.display_id}</p>
            <p className="text-muted-foreground">{order.created_at}</p>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{order.user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {order.items.length} items
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-2">
          <Badge
            variant={statusVariantMap[order.order_status]}
            className="capitalize"
          >
            {order.order_status.replaceAll(/_/g, " ").toLowerCase()}
          </Badge>
          <p className="font-bold text-lg">
            ₹{Number(order.total_price).toFixed(2)}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/owner-shops/orders/${order.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
