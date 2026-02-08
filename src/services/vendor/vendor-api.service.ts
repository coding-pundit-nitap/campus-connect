import type { BatchSlot } from "@/generated/client";
import axiosInstance from "@/lib/axios";
import type { ActionResponse } from "@/types";

import type {
  BatchInfo,
  BatchSlotWithAvailability,
  DirectOrderInfo,
} from "../batch";

interface VendorDashboardResponse {
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
class VendorApiService {
  async getVendorDetails(): Promise<VendorDashboardResponse> {
    const response =
      await axiosInstance.get<ActionResponse<VendorDashboardResponse>>(
        "/vendor/dashboard"
      );
    console.log(response.data.data);
    return response.data.data;
  }

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
}

export const vendorApiService = new VendorApiService();
