import { ClientDate } from "@/components/shared/client-date";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrderStatusInfo } from "@/lib/utils/order.utils";
import { SerializedOrderWithDetails } from "@/types";

import { SharedCard } from "../shared/shared-card";
import OrderCardFooter from "./order-card-footer";

type Props = {
  order: SerializedOrderWithDetails;
};

export default function OrderCard({ order }: Props) {
  const statusInfo = getOrderStatusInfo(order.order_status);
  const subtotal = order.items.reduce((acc, item) => {
    const price = Number(item.price);
    const discount = Number(item.product.discount || 0);
    const discountedPrice = price - (price * discount) / 100;
    return acc + discountedPrice * item.quantity;
  }, 0);

  const shopName =
    order.items.length > 0 ? order.items[0].product.shop?.name : null;
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border/80 bg-card shadow-xs transition-all duration-200 hover:scale-[1.01] hover:border-primary/40 hover:shadow-md flex flex-col md:flex-row">
      <div
        className={`
            flex flex-row items-center justify-center gap-4 p-4
            md:w-28 md:flex-col md:justify-center md:gap-2
            ${statusInfo.colorClassName.replace("text-", "bg-")}/10
            border-b md:border-b-0 md:border-r border-border/40
          `}
      >
        <statusInfo.Icon
          className={`h-8 w-8 shrink-0 ${statusInfo.colorClassName}`}
        />

        <Separator orientation="horizontal" className="flex-1 md:hidden" />

        <Separator
          orientation="vertical"
          className="hidden h-auto flex-1 md:block"
        />

        <span className="text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 leading-none">
          {statusInfo.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-col md:flex-row min-w-0 flex-1 items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-muted-foreground">
              Order #{order.display_id}
            </p>
            <h3 className="truncate font-heading font-black text-xl text-foreground mt-0.5">
              {shopName || (
                <span className="text-destructive">
                  ⚠️ Error: No items in order
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              <ClientDate date={order.created_at} format="datetime" />
            </p>

            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Batch Delivery:</span>
              {order.batch ? (
                <>
                  <span className="font-semibold text-orange-600">
                    <ClientDate
                      date={order.batch.cutoff_time}
                      format="datetime"
                    />
                  </span>
                  <Badge
                    variant="secondary"
                    className="uppercase font-bold text-[9px] rounded px-1.5 py-0 h-4"
                  >
                    {order.batch.status}
                  </Badge>
                </>
              ) : (
                <span className="text-muted-foreground/80 font-medium">
                  Not assigned yet
                </span>
              )}
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="font-heading font-black text-2xl text-foreground">
              ₹{subtotal.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              {order.items.length} {order.items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <OrderCardFooter orderId={order.id} />
      </div>
    </div>
  );
}
