import { Shop } from "@/generated/client";
import axiosInstance from "@/lib/axios";
import { ShopWithOwnerDetails } from "@/lib/shop-utils";
import { ShopWithOwner } from "@/types";
import { ActionResponse } from "@/types/response.types";

interface PaginatedShopResponse {
  data: ShopWithOwnerDetails[];
  nextCursor: string | null;
}

class ShopAPIService {
  async fetchShop({ shop_id }: { shop_id: string }): Promise<Shop> {
    const url = `shops/${shop_id}`;
    const response = await axiosInstance.get<ActionResponse<Shop>>(url);
    return response.data.data;
  }

  async fetchShopsByUser(): Promise<ShopWithOwner> {
    const url = `shops`;
    const response =
      await axiosInstance.get<ActionResponse<ShopWithOwner>>(url);
    return response.data.data;
  }

  async fetchShops({
    cursor,
  }: {
    cursor: string | null;
  }): Promise<PaginatedShopResponse> {
    const url = `shops/all`;
    const response = await axiosInstance.get<
      ActionResponse<PaginatedShopResponse>
    >(url, {
      params: {
        limit: 10,
        cursor: cursor || undefined,
      },
    });
    return response.data.data;
  }
}

export const shopAPIService = new ShopAPIService();

export default shopAPIService;
