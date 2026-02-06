import { CreditCard, Eye, MoreVertical, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderStatus, PaymentStatus } from "@/types/prisma.types";

interface OrderActionsDropdownProps {
  onViewDetails: () => void;
  onUpdateOrderStatus: (status: OrderStatus) => void;
  onUpdatePaymentStatus: (status: PaymentStatus) => void;
  disabled?: boolean;
}

export function OrderActionsDropdown({
  onViewDetails,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  disabled = false,
}: OrderActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onViewDetails}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Package className="mr-2 h-4 w-4" />
            Update Order Status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => onUpdateOrderStatus(OrderStatus.NEW)}
            >
              New
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdateOrderStatus(OrderStatus.BATCHED)}
            >
              Batched
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdateOrderStatus(OrderStatus.OUT_FOR_DELIVERY)}
            >
              Out for Delivery
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdateOrderStatus(OrderStatus.COMPLETED)}
            >
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdateOrderStatus(OrderStatus.CANCELLED)}
            >
              Cancelled
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <CreditCard className="mr-2 h-4 w-4" />
            Update Payment Status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => onUpdatePaymentStatus(PaymentStatus.PENDING)}
            >
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdatePaymentStatus(PaymentStatus.PROCESSING)}
            >
              Processing
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdatePaymentStatus(PaymentStatus.COMPLETED)}
            >
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdatePaymentStatus(PaymentStatus.FAILED)}
            >
              Failed
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdatePaymentStatus(PaymentStatus.REFUNDED)}
            >
              Refunded
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdatePaymentStatus(PaymentStatus.CANCELLED)}
            >
              Cancelled
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
