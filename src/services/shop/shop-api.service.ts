import { Shop } from "@/generated/client";
import axiosInstance from "@/lib/axios";
import { ShopWithOwnerDetails } from "@/lib/shop-utils";
import { ShopWithOwner } from "@/types";
import { ActionResponse } from "@/types/response.types";

export interface PaginatedShopResponse {
  data: ShopWithOwnerDetails[];
  nextCursor: string | null;
}

export class ShopAPIService {
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

  async fetchFavoriteShops(): Promise<
    Array<{
      id: string;
      shop: {
        id: string;
        name: string;
        image_key: string;
        location: string;
        is_active: boolean;
        opening: string;
        closing: string;
      };
    }>
  > {
    const url = `shops/favorites`;
    const response = await axiosInstance.get<
      ActionResponse<
        Array<{
          id: string;
          shop: {
            id: string;
            name: string;
            image_key: string;
            location: string;
            is_active: boolean;
            opening: string;
            closing: string;
          };
        }>
      >
    >(url);
    return response.data.data;
  }

  async checkIsFavoriteShop({
    shop_id,
  }: {
    shop_id: string;
  }): Promise<boolean> {
    const url = `shops/favorites`;
    const response = await axiosInstance.get<ActionResponse<boolean>>(url, {
      params: { shop_id },
    });
    return response.data.data;
  }
}

export const shopAPIService = new ShopAPIService();
