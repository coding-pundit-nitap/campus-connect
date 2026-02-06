import { ShopWithOwner } from "@/types";

type MoneyLike = { toString(): string };

function serializeMoney(value: unknown): string {
  if (value === null || value === undefined) return "0";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "bigint") return value.toString();

  if (typeof value === "object" && value && "toString" in value) {
    return (value as MoneyLike).toString();
  }

  return String(value);
}

export type ShopWithOwnerSerialized = Omit<
  ShopWithOwner,
  "min_order_value" | "default_delivery_fee" | "default_platform_fee"
> & {
  min_order_value: string;
  default_delivery_fee: string;
  default_platform_fee: string;
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

export function formatShopData(shop: ShopWithOwner): ShopWithOwnerSerialized & {
  openingFormatted: string;
  closingFormatted: string;
} {
  const ownerName = shop.user ? shop.user.name : "Unknown Owner";

  return {
    ...shop,
    min_order_value: serializeMoney(shop.min_order_value),
    default_delivery_fee: serializeMoney(shop.default_delivery_fee),
    default_platform_fee: serializeMoney(shop.default_platform_fee),
    user: {
      name: ownerName,
      email: shop.user ? shop.user.email : "Unknown Email",
    },
    openingFormatted: formatTime(shop.opening),
    closingFormatted: formatTime(shop.closing),
  };
}

export type ShopWithOwnerDetails = ReturnType<typeof formatShopData>;
