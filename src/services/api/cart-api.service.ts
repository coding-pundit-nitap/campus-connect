import axiosInstance from "@/lib/axios";
import { ActionResponse, SerializedFullCart } from "@/types";
class CartAPIService {
  async fetchCartForShop(shop_id: string): Promise<SerializedFullCart> {
    const url = `cart?shop_id=${shop_id}`;
    const response =
      await axiosInstance.get<ActionResponse<SerializedFullCart>>(url);
    return response.data.data;
  }

  async fetchAllUserCarts(): Promise<SerializedFullCart[]> {
    const url = `cart/all`;
    const response =
      await axiosInstance.get<ActionResponse<SerializedFullCart[]>>(url);
    return response.data.data;
  }
}

export const cartAPIService = new CartAPIService();

export default cartAPIService;
