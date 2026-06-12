import { format } from "date-fns";

import { SerializedOrderWithDetails } from "@/types";

export function OrderMeta({ order }: { order: SerializedOrderWithDetails }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-semibold mt-1">
      <span>{format(new Date(order.created_at), "h:mm a")}</span>
      <span aria-hidden className="opacity-40">
        ·
      </span>
      <span>
        {order.delivery_address_snapshot?.hostel_block ||
          order.delivery_address_snapshot?.building}
      </span>
      <span aria-hidden className="opacity-40">
        ·
      </span>
      <span>Room {order.delivery_address_snapshot?.room_number}</span>
    </div>
  );
}
