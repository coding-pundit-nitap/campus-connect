import { Order } from "@/generated/client";

import { apiGet } from "../api-client";

class SellerAPIService {
  async fetchSellerOrders(): Promise<Order[]> {
    return apiGet<Order[]>("seller/orders");
  }
}

export const sellerAPIService = new SellerAPIService();

export default sellerAPIService;
