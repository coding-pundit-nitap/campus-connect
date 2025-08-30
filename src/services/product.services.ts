import { Product } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types/response.type";

/**
 * Response interface for paginated product queries.
 *
 * Defines the structure for API responses that return product data with
 * pagination support using cursor-based pagination for efficient data retrieval.
 *
 */
interface PaginatedProductsResponse {
  /** Array of product objects for the current page */
  data: Product[];
  /** Cursor for fetching the next page of results, null if no more pages */
  nextCursor: string | null;
}

/**
 * Service class for product-related API operations.
 *
 * Provides methods to interact with the product API endpoints, including fetching
 * shop products with pagination support. Implements proper error handling and
 * type safety for all product operations.
 *
 */
class ProductAPIService {
  /**
   * Fetches products for a specific shop with pagination support.
   *
   * Retrieves a paginated list of products belonging to a specific shop.
   * Supports cursor-based pagination for efficient data loading and
   * infinite scrolling implementations.
   *
   * @param params - The parameters for fetching shop products
   * @param params.shop_id - The unique identifier of the shop
   * @param params.cursor - The pagination cursor for fetching next page (null for first page)
   * @returns A promise that resolves to paginated product data
   *
   * @throws {Error} When API request fails or returns invalid data
   *
   */
  async fetchShopProducts({
    shop_id,
    cursor,
  }: {
    shop_id: string;
    cursor: string | null;
  }): Promise<PaginatedProductsResponse> {
    const url = `/shops/${shop_id}/products?limit=10${cursor ? `&cursor=${cursor}` : ""}`;
    const response =
      await axiosInstance.get<ActionResponse<PaginatedProductsResponse>>(url);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.details || "Failed to fetch products");
    }
    return response.data.data;
  }
}

const productAPIService = new ProductAPIService();

export default productAPIService;
