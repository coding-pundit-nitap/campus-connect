import { z } from "zod";

import { APP_TIME_ZONE, getZonedParts } from "@/lib/utils/timezone";

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

  // Fail closed: a malformed (non-empty but unparsable) opening/closing
  // string must not be read as "shop is open". Callers only reach this
  // function when both strings are truthy (validateDeliveryTime below
  // gates on `shopOpening && shopClosing`), so a parse failure here means
  // malformed data, not merely unset hours — the unset case is already
  // handled upstream by skipping this check entirely.
  if (!openingTime || !closingTime) {
    return false;
  }

  const zoned = getZonedParts(deliveryTime, APP_TIME_ZONE);
  const deliveryMinutes = zoned.hour * 60 + zoned.minute;

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
