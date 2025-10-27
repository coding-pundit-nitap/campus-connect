import { Shop } from "@prisma/client";

export interface ShopWithOwner extends Shop {
  user: {
    name: string;
    email: string;
  } | null;
}
