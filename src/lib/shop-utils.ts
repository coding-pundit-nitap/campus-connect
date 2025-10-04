import { SellerVerificationStatus } from "@prisma/client";

import { ShopWithOwner } from "@/types";

type DatabaseShop = {
  owner: { email: string; name: string | null };
} & {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  description: string;
  location: string;
  opening: string;
  closing: string;
  imageKey: string | null;
  is_active: boolean;
  pg_seller_id: string | null;
  verification_status: SellerVerificationStatus;
  owner_id: string;
};

export function isShopOpen(
  shop: Pick<ShopWithOwner, "opening" | "closing">
): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(shop.opening.replace(":", ""));
  const closeTime = parseInt(shop.closing.replace(":", ""));

  if (closeTime > openTime) {
    return currentTime >= openTime && currentTime <= closeTime;
  } else {
    return currentTime >= openTime || currentTime <= closeTime;
  }
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function enhanceShopData(shop: DatabaseShop): ShopWithOwner & {
  openingFormatted: string;
  closingFormatted: string;
} {
  const ownerName = shop.owner.name || "Unknown Owner";

  return {
    ...shop,
    owner: {
      name: ownerName,
      email: shop.owner.email,
    },
    openingFormatted: formatTime(shop.opening),
    closingFormatted: formatTime(shop.closing),
  };
}

export type ShopWithOwnerDetails = ReturnType<typeof enhanceShopData>;
