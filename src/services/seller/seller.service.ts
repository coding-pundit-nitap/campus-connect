import { Order } from "@/../prisma/generated/client";
import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types/response.types";

class SellerAPIService {
  async fetchSellerOrders(): Promise<Order[]> {
    const url = `seller/orders`;
    const response = await axiosInstance.get<ActionResponse<Order[]>>(url);
    return response.data.data;
  }
}

export const sellerAPIService = new SellerAPIService();

export default sellerAPIService;
