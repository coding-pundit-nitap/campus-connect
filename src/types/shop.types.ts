import { Shop } from "@/../prisma/generated/client";

export interface ShopWithOwner extends Shop {
  user: {
    name: string;
    email: string;
  } | null;
}
