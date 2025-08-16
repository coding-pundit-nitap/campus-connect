import axiosInstance from "@/lib/axios";
import { Order } from "@prisma/client";
import { ActionResponse } from "@/types/response.type";

class OrderAPIService {
  async fetchUserOrders(): Promise<Order[]> {
    const url = `/orders`;
    const response = await axiosInstance.get<ActionResponse<Order[]>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch orders");
    }
    return response.data.data;
  }

  async fetchOrderById(orderId: string): Promise<Order> {
    const url = `/orders/${orderId}`;
    const response = await axiosInstance.get<ActionResponse<Order>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch order");
    }
    return response.data.data;
  }
}

const orderAPIService = new OrderAPIService();

export default orderAPIService;
