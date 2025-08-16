import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types/response.type";
import { FullCart } from "../cart.services";

class CartAPIService {
  async fetchCartForShop(shop_id: string): Promise<FullCart> {
    const url = `/cart?shop_id=${shop_id}`;
    const response = await axiosInstance.get<ActionResponse<FullCart>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch cart");
    }
    return response.data.data;
  }

  async upsertCartItem(
    product_id: string,
    quantity: number
  ): Promise<FullCart> {
    const url = `/cart`;
    const response = await axiosInstance.post<ActionResponse<FullCart>>(url, {
      product_id,
      quantity,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to update cart");
    }
    return response.data.data;
  }
}

const cartAPIService = new CartAPIService();

export default cartAPIService;
