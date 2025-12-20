import { z } from "zod";

export const deliveryTimeSchema = z
  .date()
  .optional()
  .refine(
    (date) => {
      if (!date) return true;
      const now = new Date();
      const minTime = new Date(now.getTime() + 15 * 60 * 1000);
      return date >= minTime;
    },
    {
      message: "Delivery time must be at least 15 minutes from now",
    }
  )
  .refine(
    (date) => {
      if (!date) return true;
      const now = new Date();
      const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return date <= maxTime;
    },
    {
      message: "Delivery time must be within 7 days",
    }
  );

export function parseTimeString(
  timeStr: string
): { hours: number; minutes: number } | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function isWithinShopHours(
  deliveryTime: Date,
  opening: string,
  closing: string
): boolean {
  const openingTime = parseTimeString(opening);
  const closingTime = parseTimeString(closing);

  if (!openingTime || !closingTime) {
    console.warn(
      `Could not parse shop hours: opening=${opening}, closing=${closing}`
    );
    return true;
  }

  const IST_OFFSET_MINUTES = 330;
  const deliveryTimeIST = new Date(
    deliveryTime.getTime() + IST_OFFSET_MINUTES * 60 * 1000
  );
  const deliveryHour = deliveryTimeIST.getUTCHours();
  const deliveryMinute = deliveryTimeIST.getUTCMinutes();
  const deliveryMinutes = deliveryHour * 60 + deliveryMinute;

  const openingMinutes = openingTime.hours * 60 + openingTime.minutes;
  const closingMinutes = closingTime.hours * 60 + closingTime.minutes;

  if (closingMinutes < openingMinutes) {
    return (
      deliveryMinutes >= openingMinutes || deliveryMinutes <= closingMinutes
    );
  }

  return deliveryMinutes >= openingMinutes && deliveryMinutes <= closingMinutes;
}

export function validateDeliveryTime(
  deliveryTime: Date | undefined,
  shopOpening?: string,
  shopClosing?: string
): string | null {
  if (!deliveryTime) return null;

  const now = new Date();
  const minTime = new Date(now.getTime() + 15 * 60 * 1000);
  const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (deliveryTime < minTime) {
    return "Delivery time must be at least 15 minutes from now";
  }

  if (deliveryTime > maxTime) {
    return "Delivery time must be within 7 days";
  }

  if (shopOpening && shopClosing) {
    if (!isWithinShopHours(deliveryTime, shopOpening, shopClosing)) {
      return `Delivery time must be within shop hours (${shopOpening} - ${shopClosing})`;
    }
  }

  return null;
}

export const upiTransactionIdSchema = z
  .string()
  .optional()
  .refine(
    (id) => {
      if (!id) return true;
      return /^[A-Za-z0-9]{10,35}$/.test(id);
    },
    {
      message: "Invalid UPI transaction ID format",
    }
  );
