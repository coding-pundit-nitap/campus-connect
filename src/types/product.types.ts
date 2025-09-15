import { Category, Product } from "@prisma/client";

export type SerializedProduct = Omit<Product, "price" | "discount"> & {
  price: number;
  discount: number | null;
  category?: Category | null;
};

export type SerializedProductDetail = SerializedProduct & {
  shop: { name: string };
  review_count: number;
};
