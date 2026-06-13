import { Category, Product, ShopType } from "@/generated/client";

export type SerializedProduct = Omit<
  Product,
  "price" | "discount" | "rating_sum" | "review_count"
> & {
  price: number;
  discount: number | null;
  category?: Category | null;
  rating: number;
  shop: { name: string; id: string; shop_type?: ShopType } | null;
};

export type SerializedProductDetail = SerializedProduct & {
  shop: { name: string; id: string; shop_type?: ShopType } | null;
};

export type ProductDataDetails = {
  allProducts: SerializedProduct[];
  displayProducts: SerializedProduct[];
  showFilters: boolean;
  showNoMatchMessage: boolean;
  productCountMessage: string;
  isEmptyState: boolean;
  isEmpty: boolean;
};
