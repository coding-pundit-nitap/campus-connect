import { SerializedOrderWithDetails } from "@/types";

import { OrderAge } from "./order-age";

export function OrderMeta({
  order,
  isFood,
  now,
  escalate = false,
}: {
  order: SerializedOrderWithDetails;
  isFood: boolean;
  now: Date;
  escalate?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground font-semibold mt-1">
      <OrderAge
        createdAt={order.created_at}
        isFood={isFood}
        escalate={escalate}
        now={now}
      />
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
      <span className="text-sm font-bold text-foreground">
        Room {order.delivery_address_snapshot?.room_number}
      </span>
    </div>
  );
}
