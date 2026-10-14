import { Shop } from "@/generated/client";
import { ShopWithOwnerDetails } from "@/lib/shop-utils";
import { ShopWithOwner } from "@/types";

import { apiGet } from "../api-client";

export interface PaginatedShopResponse {
  data: ShopWithOwnerDetails[];
  nextCursor: string | null;
}

export class ShopAPIService {
  async fetchShop({ shop_id }: { shop_id: string }): Promise<Shop> {
    return apiGet<Shop>(`shops/${shop_id}`);
  }

  async fetchShopsByUser(): Promise<ShopWithOwner> {
    return apiGet<ShopWithOwner>("shops");
  }

  async fetchShops({
    cursor,
  }: {
    cursor: string | null;
  }): Promise<PaginatedShopResponse> {
    return apiGet<PaginatedShopResponse>("shops/all", {
      params: { limit: 10, cursor: cursor || undefined },
    });
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
    return apiGet("shops/favorites");
  }

  async checkIsFavoriteShop({
    shop_id,
  }: {
    shop_id: string;
  }): Promise<boolean> {
    return apiGet<boolean>("shops/favorites", { params: { shop_id } });
  }
}

export const shopAPIService = new ShopAPIService();
