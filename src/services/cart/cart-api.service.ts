import { SerializedFullCart } from "@/types";

import { apiGet } from "../api-client";

class CartAPIService {
  async fetchCartForShop(shop_id: string): Promise<SerializedFullCart> {
    return apiGet<SerializedFullCart>(`cart?shop_id=${shop_id}`, {
      params: { shop_id },
    });
  }

  async fetchAllUserCarts(): Promise<SerializedFullCart[]> {
    return apiGet<SerializedFullCart[]>("cart/all");
  }
}

export const cartAPIService = new CartAPIService();

export default cartAPIService;
