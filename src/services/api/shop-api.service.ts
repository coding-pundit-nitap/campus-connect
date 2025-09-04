import { Shop } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { ShopWithOwner } from "@/types";
import { ActionResponse } from "@/types/response.types";

interface PaginatedShopResponse {
  /** Array of shop objects for the current page */
  data: ShopWithOwner[];
  /** Cursor for fetching the next page of results, null if no more pages */
  nextCursor: string | null;
}

class ShopAPIService {
  async fetchShop({ shop_id }: { shop_id: string }): Promise<Shop> {
    const url = `/shops/${shop_id}`;
    const response = await axiosInstance.get<ActionResponse<Shop>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch shop");
    }
    return response.data.data;
  }

  async fetchShopsByUser(): Promise<ShopWithOwner> {
    const url = `/shops`;
    const response =
      await axiosInstance.get<ActionResponse<ShopWithOwner>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch shops");
    }
    return response.data.data;
  }

  async fetchShops({
    cursor,
  }: {
    cursor: string | null;
  }): Promise<PaginatedShopResponse> {
    const url = `/shops/all?limit=10${cursor ? `&cursor=${cursor}` : ""}`;
    const response =
      await axiosInstance.get<ActionResponse<PaginatedShopResponse>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch products");
    }
    return response.data.data;
  }
}

export const shopAPIService = new ShopAPIService();

export default shopAPIService;
