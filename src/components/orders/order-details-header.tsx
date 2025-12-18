import { DownloadPDFButton } from "@/components/orders/download-pdf-button";
import { Badge } from "@/components/ui/badge";
import {
  getOrderStatusInfo,
  getPaymentStatusInfo,
} from "@/lib/utils/order.utils";
import { SerializedOrderWithDetails } from "@/types";

type Props = {
  order: SerializedOrderWithDetails;
};

export default function OrderDetailsHeader({ order }: Props) {
  const orderStatusInfo = getOrderStatusInfo(order.order_status);
  const paymentStatusInfo = getPaymentStatusInfo(order.payment_status);

  const subtotal = order.items.reduce((acc, item) => {
    return (
      acc +
      (item.price - (item.price * (item.product.discount || 0)) / 100) *
        item.quantity
    );
  }, 0);

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Order #{order.display_id}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-3xl font-bold">₹{subtotal.toFixed(2)}</p>
          <p className="text-sm capitalize text-muted-foreground">
            via {order.payment_method.toLowerCase().replace(/_/g, " ")}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={`gap-1.5 ${orderStatusInfo.colorClassName}`}
        >
          <orderStatusInfo.Icon className="h-3.5 w-3.5" />
          {orderStatusInfo.label}
        </Badge>
        <Badge
          variant="outline"
          className={`gap-1.5 ${paymentStatusInfo.colorClassName}`}
        >
          <paymentStatusInfo.Icon className="h-3.5 w-3.5" />
          Payment {paymentStatusInfo.label}
        </Badge>
        <DownloadPDFButton order_id={order.id} display_id={order.display_id} />
      </div>
    </div>
  );
}
