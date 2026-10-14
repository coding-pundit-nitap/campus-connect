import { ServerProductData } from "@/services/product/product.service";
import { SerializedProduct } from "@/types/product.types";

import { apiGet } from "../api-client";

interface PaginatedProductsResponse {
  data: SerializedProduct[];
  nextCursor: string | null;
}

class ProductAPIService {
  async fetchShopProducts({
    shop_id,
    cursor,
    sortBy,
    sortOrder,
    categoryId,
    search,
    inStock,
  }: {
    shop_id: string;
    cursor: string | null;
    sortBy?: string;
    sortOrder?: string;
    categoryId?: string;
    search?: string;
    inStock?: boolean;
  }): Promise<PaginatedProductsResponse> {
    return apiGet<PaginatedProductsResponse>(`shops/${shop_id}/products`, {
      params: {
        limit: 20,
        cursor: cursor || undefined,
        sortBy,
        sortOrder,
        categoryId,
        search,
        inStock,
      },
    });
  }

  async fetchProducts({
    limit = 10,
    cursor,
    categoryId,
    hasDiscount,
  }: {
    limit?: number;
    cursor?: string | null;
    categoryId?: string;
    hasDiscount?: boolean;
  }): Promise<ServerProductData> {
    return apiGet<ServerProductData>("products", {
      params: {
        limit,
        cursor: cursor || undefined,
        categoryId: categoryId || undefined,
        hasDiscount: hasDiscount || undefined,
      },
    });
  }

  async fetchStockWatches(): Promise<
    Array<{
      id: string;
      product: {
        id: string;
        name: string;
        price: string;
        image_key: string;
        stock_quantity: number;
        shop: { name: string };
      };
    }>
  > {
    return apiGet("products/stock-watch");
  }

  async checkIsWatchingStock({
    product_id,
  }: {
    product_id: string;
  }): Promise<boolean> {
    return apiGet<boolean>("products/stock-watch", { params: { product_id } });
  }
}

export const productAPIService = new ProductAPIService();

export default productAPIService;
