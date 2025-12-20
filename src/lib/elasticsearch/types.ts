import type { estypes } from "@elastic/elasticsearch";

export type SortOrder = "asc" | "desc";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface ProductSearchParams extends PaginationParams, SortParams {
  query?: string;
  shopId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface ShopSearchParams extends PaginationParams {
  query?: string;
  isActive?: boolean;
}

export interface CategorySearchParams extends PaginationParams {
  query?: string;
  shopId?: string;
}

export interface ProductDocument {
  name: string;
  description: string;
  price: number;
  discount: number | null;
  stock_quantity: number;
  image_key: string;
  category_id: string | null;
  category_name: string | null;
  shop_id: string;
  shop_name: string;
  shop_is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopDocument {
  name: string;
  description: string;
  location: string;
  image_key: string;
  is_active: boolean;
  created_at: string;
}

export interface CategoryDocument {
  name: string;
  shop_id: string;
}

export interface ESSearchResult<T> {
  hits: (T & { id: string })[];
  total: number;
  page: number;
  totalPages: number;
}

export function extractTotal(
  total: estypes.SearchTotalHits | number | undefined
): number {
  if (typeof total === "number") return total;
  if (total && typeof total === "object" && "value" in total)
    return total.value;
  return 0;
}
