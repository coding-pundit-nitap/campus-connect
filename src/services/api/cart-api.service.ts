import axiosInstance from "@/lib/axios";
import { ActionResponse, FullCart } from "@/types";
class CartAPIService {
  async fetchCartForShop(shop_id: string): Promise<FullCart> {
    const url = `/cart?shop_id=${shop_id}`;
    const response = await axiosInstance.get<ActionResponse<FullCart>>(url);
    return response.data.data;
  }

  async fetchAllUserCarts(): Promise<FullCart[]> {
    const url = `/cart/all`;
    const response = await axiosInstance.get<ActionResponse<FullCart[]>>(url);
    return response.data.data;
  }
}

export const cartAPIService = new CartAPIService();

export default cartAPIService;
