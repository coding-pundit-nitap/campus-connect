import axiosInstance from "@/lib/axios";

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
      await axiosInstance.get<VendorDashboardResponse>("/vendor/dashboard");
    return response.data;
  }

  async getNextSlot(shopId: string): Promise<NextSlotResponse> {
    const response = await axiosInstance.get<NextSlotResponse>(
      `/shops/${shopId}/next-slot`
    );
    return response.data;
  }

  async getVendorOverview(): Promise<VendorOverviewResponse> {
    const response =
      await axiosInstance.get<VendorOverviewResponse>("/vendor/overview");
    return response.data;
  }
}

export const vendorApiService = new VendorApiService();
