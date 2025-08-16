import axiosInstance from "@/lib/axios";
import { Product } from "@prisma/client";
import { ActionResponse } from "@/types/response.type";

interface PaginatedProductsResponse {
  data: Product[];
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
