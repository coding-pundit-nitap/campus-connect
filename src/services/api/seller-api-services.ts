import axiosInstance from "@/lib/axios";
import { Order } from "@prisma/client";
import { ActionResponse } from "@/types/response.type";

class SellerAPIService {
  async fetchSellerOrders(): Promise<Order[]> {
    const url = `/seller/orders`;
    const response = await axiosInstance.get<ActionResponse<Order[]>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch seller orders");
    }
    return response.data.data;
  }
}

const sellerAPIService = new SellerAPIService();

export default sellerAPIService;
