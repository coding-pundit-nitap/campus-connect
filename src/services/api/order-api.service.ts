import axiosInstance from "@/lib/axios";
import { ActionResponse, SerializedOrderWithDetails } from "@/types";

class OrderAPIService {
  async fetchUserOrders(): Promise<SerializedOrderWithDetails[]> {
    const url = `/orders`;
    const response =
      await axiosInstance.get<ActionResponse<SerializedOrderWithDetails[]>>(
        url
      );
    return response.data.data;
  }
}

export const orderAPIService = new OrderAPIService();

export default orderAPIService;
