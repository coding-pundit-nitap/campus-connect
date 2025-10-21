import { OrderStatus, PaymentStatus } from "@prisma/client";

import { SharedSearchInput } from "@/components/shared/shared-search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderFilterBarProps {
  search: string;
  orderStatusFilter: string;
  paymentStatusFilter: string;
  onSearchChange: (value: string) => void;
  onOrderStatusChange: (value: string) => void;
  onPaymentStatusChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
}

export function OrderFilterBar({
  search,
  orderStatusFilter,
  paymentStatusFilter,
  onSearchChange,
  onOrderStatusChange,
  onPaymentStatusChange,
  onSearch,
  onClearSearch,
}: OrderFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-2">
      <div className="flex-1">
        <SharedSearchInput
          placeholder="Search by order ID or customer phone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          showIcon
          showClear
          onClear={onClearSearch}
          className="min-w-1/2"
        />
      </div>
      <Select value={orderStatusFilter} onValueChange={onOrderStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Order Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Orders</SelectItem>
          <SelectItem value={OrderStatus.NEW}>New</SelectItem>
          <SelectItem value={OrderStatus.PREPARING}>Preparing</SelectItem>
          <SelectItem value={OrderStatus.READY_FOR_PICKUP}>
            Ready for Pickup
          </SelectItem>
          <SelectItem value={OrderStatus.OUT_FOR_DELIVERY}>
            Out for Delivery
          </SelectItem>
          <SelectItem value={OrderStatus.COMPLETED}>Completed</SelectItem>
          <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Select value={paymentStatusFilter} onValueChange={onPaymentStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Payment Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Payments</SelectItem>
          <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
          <SelectItem value={PaymentStatus.PROCESSING}>Processing</SelectItem>
          <SelectItem value={PaymentStatus.COMPLETED}>Completed</SelectItem>
          <SelectItem value={PaymentStatus.FAILED}>Failed</SelectItem>
          <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
          <SelectItem value={PaymentStatus.CANCELLED}>Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={onSearch}>Search</Button>
    </div>
  );
}
