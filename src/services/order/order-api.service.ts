import axiosInstance from "@/lib/axios";
import {
  ActionResponse,
  CursorPaginatedResponse,
  SerializedOrderWithDetails,
} from "@/types";

class OrderAPIService {
  async fetchUserOrders({
    limit = 10,
    cursor,
  }: {
    limit?: number;
    cursor?: string | null;
  }): Promise<CursorPaginatedResponse<SerializedOrderWithDetails>> {
    const url = `orders`;
    const response = await axiosInstance.get<
      ActionResponse<CursorPaginatedResponse<SerializedOrderWithDetails>>
    >(url, {
      params: {
        limit,
        cursor: cursor || undefined,
      },
    });
    return response.data.data;
  }

  async dounloadInvoice(order_id: string): Promise<Blob> {
    const url = `orders/${order_id}/pdf`;
    const response = await axiosInstance.get<Blob>(url, {
      responseType: "blob",
    });
    return response.data;
  }
}

export const orderAPIService = new OrderAPIService();

export default orderAPIService;
