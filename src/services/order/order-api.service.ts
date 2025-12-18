import axiosInstance from "@/lib/axios";
import { ActionResponse, SerializedOrderWithDetails } from "@/types";

class OrderAPIService {
  async fetchUserOrders(): Promise<SerializedOrderWithDetails[]> {
    const url = `orders`;
    const response =
      await axiosInstance.get<ActionResponse<SerializedOrderWithDetails[]>>(
        url
      );
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
