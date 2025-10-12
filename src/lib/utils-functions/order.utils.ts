import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Shop,
} from "@prisma/client";
import {
  BadgeCent,
  Bike,
  CheckCircle2,
  CircleDot,
  CircleSlash,
  Clock,
  CookingPot,
  LucideIcon,
  Package,
  RefreshCcw,
  XCircle,
} from "lucide-react";

import {
  OrderWithDetails,
  SearchResult,
  SerializedOrder,
  SerializedOrderItem,
  SerializedOrderWithDetails,
  SerializedShop,
} from "@/types";

import { serializeProduct } from "./product.utils";

interface StatusInfo {
  label: string;
  Icon: LucideIcon;
  colorClassName: string;
}

export const transformDateToLocaleString = (date: Date): string => {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const serializeShop = (shop: Shop): SerializedShop => {
  return {
    ...shop,
    created_at: transformDateToLocaleString(shop.created_at),
    updated_at: transformDateToLocaleString(shop.updated_at),
  };
};

export const serializeOrderItem = (
  orderItem: OrderItem
): SerializedOrderItem => {
  return {
    ...orderItem,
    price: Number(orderItem.price),
    quantity: Number(orderItem.quantity),
  };
};

export const serializeOrder = (order: Order): SerializedOrder => {
  return {
    ...order,
    created_at: transformDateToLocaleString(order.created_at),
    updated_at: transformDateToLocaleString(order.updated_at),
    total_price: Number(order.total_price),
    requested_delivery_time: order.requested_delivery_time
      ? transformDateToLocaleString(order.requested_delivery_time)
      : undefined,
    estimated_delivery_time: order.estimated_delivery_time
      ? transformDateToLocaleString(order.estimated_delivery_time)
      : undefined,
    actual_delivery_time: order.actual_delivery_time
      ? transformDateToLocaleString(order.actual_delivery_time)
      : undefined,
  };
};

export const serializeOrderWithDetails = (
  order: OrderWithDetails
): SerializedOrderWithDetails => {
  return {
    ...serializeOrder(order),
    shop: {
      ...serializeShop(order.shop),
    },
    items: order.items.map((item) => ({
      ...serializeOrderItem(item),
      product: serializeProduct(item.product),
    })),
    user: {
      name: order.user.name || "Unknown",
      phone: order.user.phone || "Unknown",
    },
  };
};

interface SearchNavigationHandlerProps {
  onNavigateToShop: (shopId: string) => void;
  onNavigateToProduct: (productId: string, shopId?: string) => void;
}

export function createSearchNavigationHandler({
  onNavigateToShop,
  onNavigateToProduct,
}: SearchNavigationHandlerProps) {
  return (selectedItem: SearchResult) => {
    if (selectedItem.type === "shop") {
      onNavigateToShop(selectedItem.id);
    } else if (selectedItem.type === "product") {
      onNavigateToProduct(selectedItem.id, selectedItem.shop_id);
    }
  };
}

export function mapSearchResultsToSuggestions(searchResults: SearchResult[]) {
  return searchResults.map((result) => ({
    id: result.id,
    title: result.title,
    subtitle: result.subtitle,
  }));
}

export const getOrderStatusInfo = (status: OrderStatus): StatusInfo => {
  const info: Record<OrderStatus, StatusInfo> = {
    NEW: {
      label: "New",
      Icon: CircleDot,
      colorClassName: "text-blue-500",
    },
    PREPARING: {
      label: "Preparing",
      Icon: CookingPot,
      colorClassName: "text-orange-500",
    },
    READY_FOR_PICKUP: {
      label: "Ready for Pickup",
      Icon: Package,
      colorClassName: "text-yellow-500",
    },
    OUT_FOR_DELIVERY: {
      label: "Out for Delivery",
      Icon: Bike,
      colorClassName: "text-purple-500",
    },
    COMPLETED: {
      label: "Completed",
      Icon: CheckCircle2,
      colorClassName: "text-green-500",
    },
    CANCELLED: {
      label: "Cancelled",
      Icon: XCircle,
      colorClassName: "text-red-500",
    },
  };
  return info[status];
};

export const getPaymentStatusInfo = (status: PaymentStatus): StatusInfo => {
  const info: Record<PaymentStatus, StatusInfo> = {
    PENDING: {
      label: "Pending",
      Icon: Clock,
      colorClassName: "text-yellow-500",
    },
    PROCESSING: {
      label: "Processing",
      Icon: RefreshCcw,
      colorClassName: "text-blue-500",
    },
    COMPLETED: {
      label: "Paid",
      Icon: CheckCircle2,
      colorClassName: "text-green-500",
    },
    FAILED: {
      label: "Failed",
      Icon: XCircle,
      colorClassName: "text-red-500",
    },
    REFUNDED: {
      label: "Refunded",
      Icon: BadgeCent,
      colorClassName: "text-blue-500",
    },
    CANCELLED: {
      label: "Cancelled",
      Icon: CircleSlash,
      colorClassName: "text-gray-500",
    },
  };
  return info[status];
};
