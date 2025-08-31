import { Order, OrderItem, Product, Shop } from "@prisma/client";
export type OrderWithDetails = Order & {
  shop: Shop;
  items: (OrderItem & {
    product: Product;
  })[];
};
