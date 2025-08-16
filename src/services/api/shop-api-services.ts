import axiosInstance from "@/lib/axios";
import { Shop } from "@prisma/client";
import { ActionResponse } from "@/types/response.type";

class ShopAPIService {
  async fetchShop({ shop_id }: { shop_id: string }): Promise<Shop> {
    const url = `/shops/${shop_id}`;
    const response = await axiosInstance.get<ActionResponse<Shop>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch shop");
    }
    return response.data.data;
  }
}

const shopAPIService = new ShopAPIService();

export default shopAPIService;
