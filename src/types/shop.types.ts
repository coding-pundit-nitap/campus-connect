import { Shop } from "@prisma/client";

export interface ShopWithOwner extends Shop {
  owner: {
    name: string;
    email: string;
  };
}
