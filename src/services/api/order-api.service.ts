import { Order } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { ActionResponse, OrderWithDetails } from "@/types";

class OrderAPIService {
  async fetchUserOrders(): Promise<OrderWithDetails[]> {
    const url = `/orders`;
    const response =
      await axiosInstance.get<ActionResponse<OrderWithDetails[]>>(url);
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
