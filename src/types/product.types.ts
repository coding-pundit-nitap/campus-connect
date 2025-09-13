import { Product, Category } from "@prisma/client";

export type SerializedProduct = Omit<Product, "price" | "discount"> & {
  price: number;
  discount: number | null;
  category?: Category | null;
};
