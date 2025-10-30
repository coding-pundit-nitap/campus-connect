import axiosInstance from "@/lib/axios";
import { SerializedProduct } from "@/types/product.types";
import { ActionResponse } from "@/types/response.types";

import { ServerProductData } from "../product.service";

interface PaginatedProductsResponse {
  data: SerializedProduct[];
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
    const url = `shops/${shop_id}/products`;
    const response = await axiosInstance.get<
      ActionResponse<PaginatedProductsResponse>
    >(url, {
      params: {
        limit: 20,
        cursor: cursor || undefined,
      },
    });
    return response.data.data;
  }

  async fetchProducts({
    limit = 10,
    cursor,
  }: {
    limit?: number;
    cursor?: string | null;
  }): Promise<ServerProductData> {
    const url = `products`;

    const response = await axiosInstance.get<ActionResponse<ServerProductData>>(
      url,
      {
        params: {
          limit: limit,
          cursor: cursor || undefined,
        },
      }
    );
    return response.data.data;
  }
}

export const productAPIService = new ProductAPIService();

export default productAPIService;
