import { Order } from "@prisma/client";

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

  async fetchOrderById(order_id: string): Promise<Order> {
    const url = `/orders/${order_id}`;
    const response = await axiosInstance.get<ActionResponse<Order>>(url);
    return response.data.data;
  }
}

export const orderAPIService = new OrderAPIService();

export default orderAPIService;
