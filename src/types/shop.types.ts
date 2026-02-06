import { Shop } from "@/../prisma/generated/client";

export interface ShopWithOwner extends Shop {
  user: {
    name: string;
    email: string;
  } | null;
}

export type ShopUpdateFormShop = {
  id: string;
  name: string;
  description: string;
  location: string;
  opening: string;
  closing: string;
  image_key: string;
  qr_image_key: string;
  upi_id: string;
  min_order_value: string | number;
  default_delivery_fee: string | number;
  default_platform_fee: string | number;
  user: {
    name: string;
    email: string;
  } | null;
};
