import { BatchMilestone, BatchStatus } from "@/generated/client";
import axiosInstance from "@/lib/axios";
import type { ActionResponse, SerializedOrderWithDetails } from "@/types";

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

export interface VendorOverviewResponse {
  productCount: number;
  categoryCount: number;
  totalOrders: number;
  pendingOrders: number;
  todayEarnings: number;
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
    const response = await axiosInstance.get<
      ActionResponse<BatchSlotWithAvailability[]>
    >(`/shops/${shopId}/batch-slots`);
    return response.data.data;
  }

  async getNextSlot(shopId: string): Promise<NextSlotResponse> {
    const response = await axiosInstance.get<ActionResponse<NextSlotResponse>>(
      `/shops/${shopId}/next-slot`
    );
    return response.data.data;
  }

  async getVendorOverview(): Promise<VendorOverviewResponse> {
    const response =
      await axiosInstance.get<ActionResponse<VendorOverviewResponse>>(
        "/vendor/overview"
      );
    return response.data.data;
  }

  async getActiveBatchData(): Promise<ActiveBatchResponse> {
    const response = await axiosInstance.get<
      ActionResponse<ActiveBatchResponse>
    >("/vendor/batch/active");
    return response.data.data;
  }

  async getDirectDeliveriesData(): Promise<SerializedOrderWithDetails[]> {
    const response = await axiosInstance.get<
      ActionResponse<SerializedOrderWithDetails[]>
    >("/vendor/batch/direct-deliveries");
    return response.data.data;
  }

  async getDeliveryRunData(): Promise<SerializedOrderWithDetails[]> {
    const response = await axiosInstance.get<
      ActionResponse<SerializedOrderWithDetails[]>
    >("/vendor/batch/delivery-run");
    return response.data.data;
  }

  async getOrderConsoleData(): Promise<VendorOrderConsoleResponse> {
    const response = await axiosInstance.get<
      ActionResponse<VendorOrderConsoleResponse>
    >("/vendor/orders/console");
    return response.data.data;
  }

  async getVendorEarnings(period: string): Promise<VendorEarningsResponse> {
    const response = await axiosInstance.get<
      ActionResponse<VendorEarningsResponse>
    >(`/vendor/earnings?period=${encodeURIComponent(period)}`);
    return response.data.data;
  }

  async getVendorOrderHistory(
    params: OrderHistoryParams
  ): Promise<VendorOrderHistoryResponse> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") query.set(key, String(value));
    }
    const response = await axiosInstance.get<
      ActionResponse<VendorOrderHistoryResponse>
    >(`/vendor/orders/history?${query.toString()}`);
    return response.data.data;
  }
}

export const vendorApiService = new VendorApiService();
export default vendorApiService;
