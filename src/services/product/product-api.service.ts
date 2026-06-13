import axiosInstance from "@/lib/axios";
import { ServerProductData } from "@/services/product/product.service";
import { SerializedProduct } from "@/types/product.types";
import { ActionResponse } from "@/types/response.types";

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
    const url = `shops/${shop_id}/products`;
    const response = await axiosInstance.get<
      ActionResponse<PaginatedProductsResponse>
    >(url, {
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
    return response.data.data;
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
    const url = `products`;

    const response = await axiosInstance.get<ActionResponse<ServerProductData>>(
      url,
      {
        params: {
          limit: limit,
          cursor: cursor || undefined,
          categoryId: categoryId || undefined,
          hasDiscount: hasDiscount || undefined,
        },
      }
    );
    return response.data.data;
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
    const url = `products/stock-watch`;
    const response = await axiosInstance.get<
      ActionResponse<
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
      >
    >(url);
    return response.data.data;
  }

  async checkIsWatchingStock({
    product_id,
  }: {
    product_id: string;
  }): Promise<boolean> {
    const url = `products/stock-watch`;
    const response = await axiosInstance.get<ActionResponse<boolean>>(url, {
      params: { product_id },
    });
    return response.data.data;
  }
}

export const productAPIService = new ProductAPIService();

export default productAPIService;
