import axiosInstance from "@/lib/axios";
import { SerializedProduct } from "@/types/product.types";
import { ActionResponse } from "@/types/response.types";

import { ServerProductData } from "../product.service";

interface PaginatedProductsResponse {
  /** Array of product objects for the current page */
  data: SerializedProduct[];
  /** Cursor for fetching the next page of results, null if no more pages */
  nextCursor: string | null;
}

class ProductAPIService {
  async fetchShopProducts({
    shop_id,
    cursor,
  }: {
    shop_id: string;
    cursor: string | null;
  }): Promise<PaginatedProductsResponse> {
    const url = `/shops/${shop_id}/products?limit=20${cursor ? `&cursor=${cursor}` : ""}`;
    const response =
      await axiosInstance.get<ActionResponse<PaginatedProductsResponse>>(url);
    return response.data.data;
  }

  async fetchProducts({
    limit = 10,
    cursor,
  }: {
    limit?: number;
    cursor?: string | null;
  }): Promise<ServerProductData> {
    const url = `/products?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;

    const response =
      await axiosInstance.get<ActionResponse<ServerProductData>>(url);
    return response.data.data;
  }
}

export const productAPIService = new ProductAPIService();

export default productAPIService;
