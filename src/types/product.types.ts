import { Category, Product } from "@prisma/client";

export type SerializedProduct = Omit<
  Product,
  "price" | "discount" | "rating_sum" | "review_count"
> & {
  price: number;
  discount: number | null;
  category?: Category | null;
  rating: number;
};

export type SerializedProductDetail = SerializedProduct & {
  shop: { name: string };
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
