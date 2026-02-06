import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types";

import { BatchInfo } from "../batch";

interface VendorDashboardResponse {
  open_batch: BatchInfo | null;
  active_batches: BatchInfo[];
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
