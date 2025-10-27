import { ShopWithOwner } from "@/types";

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

export function formatShopData(shop: ShopWithOwner): ShopWithOwner & {
  openingFormatted: string;
  closingFormatted: string;
} {
  const ownerName = shop.user ? shop.user.name : "Unknown Owner";

  return {
    ...shop,
    user: {
      name: ownerName,
      email: shop.user ? shop.user.email : "Unknown Email",
    },
    openingFormatted: formatTime(shop.opening),
    closingFormatted: formatTime(shop.closing),
  };
}

export type ShopWithOwnerDetails = ReturnType<typeof formatShopData>;
