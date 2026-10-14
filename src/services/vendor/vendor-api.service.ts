import { BatchMilestone, BatchStatus } from "@/generated/client";
import type { SerializedOrderWithDetails } from "@/types";

import { apiGet } from "../api-client";
import type {
  BatchInfo,
  BatchSlotWithAvailability,
  DirectOrderInfo,
} from "../batch";

export interface SerializedBatch {
  id: string;
  shop_id: string;
  slot_id: string | null;
  cutoff_time: string;
  status: BatchStatus;
  collective_total: string;
  min_order_value_snapshot: string | null;
  created_at: string;
  updated_at: string;
  delivery_status?: {
    id: string;
    batch_id: string;
    current_milestone: BatchMilestone;
    estimated_arrival: string | null;
    rider_name: string | null;
    rider_phone: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

export interface ActiveBatchResponse {
  batch: SerializedBatch | null;
  orders: SerializedOrderWithDetails[];
}

export interface VendorOrderConsoleResponse {
  activeBatch: SerializedBatch | null;
  batchOrders: SerializedOrderWithDetails[];
  directOrders: SerializedOrderWithDetails[];
  deliveryOrders: SerializedOrderWithDetails[];
}

export interface VendorDashboardResponse {
  open_batch: BatchInfo | null;
  active_batches: BatchInfo[];
  direct_orders: DirectOrderInfo[];
}

interface NextSlotResponse {
  enabled: boolean;
  cutoff_time: string | null;
  batch_id: string | null;
  minutes_remaining: number | null;
  is_open: boolean;
}

export interface VendorEarningsResponse {
  period: string;
  periodStart: string;
  periodEnd: string;
  customersPaid: number;
  platformFee: number;
  vendorEarnings: number;
  orderCount: number;
  cash: { earnings: number; platformFeeOwed: number; orderCount: number };
  online: { earnings: number; orderCount: number };
}

export interface OrderHistoryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
}

export interface VendorOrderHistoryResponse {
  orders: SerializedOrderWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

class VendorApiService {
  async getBatchSlots(shopId: string): Promise<BatchSlotWithAvailability[]> {
    return apiGet<BatchSlotWithAvailability[]>(`/shops/${shopId}/batch-slots`);
  }

  async getNextSlot(shopId: string): Promise<NextSlotResponse> {
    return apiGet<NextSlotResponse>(`/shops/${shopId}/next-slot`);
  }

  async getActiveBatchData(): Promise<ActiveBatchResponse> {
    return apiGet<ActiveBatchResponse>("/vendor/batch/active");
  }

  async getDirectDeliveriesData(): Promise<SerializedOrderWithDetails[]> {
    return apiGet<SerializedOrderWithDetails[]>(
      "/vendor/batch/direct-deliveries"
    );
  }

  async getDeliveryRunData(): Promise<SerializedOrderWithDetails[]> {
    return apiGet<SerializedOrderWithDetails[]>("/vendor/batch/delivery-run");
  }

  async getOrderConsoleData(): Promise<VendorOrderConsoleResponse> {
    return apiGet<VendorOrderConsoleResponse>("/vendor/orders/console");
  }

  async getVendorEarnings(period: string): Promise<VendorEarningsResponse> {
    return apiGet<VendorEarningsResponse>(
      `/vendor/earnings?period=${encodeURIComponent(period)}`
    );
  }

  async getVendorOrderHistory(
    params: OrderHistoryParams
  ): Promise<VendorOrderHistoryResponse> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") query.set(key, String(value));
    }
    return apiGet<VendorOrderHistoryResponse>(
      `/vendor/orders/history?${query.toString()}`
    );
  }
}

export const vendorApiService = new VendorApiService();
export default vendorApiService;
