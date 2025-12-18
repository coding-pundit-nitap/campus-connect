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

export function isShopOpen(opening: string, closing: string): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMinutes = currentHour * 60 + currentMinute;

  const openingTime = parseTimeString(opening);
  const closingTime = parseTimeString(closing);

  if (!openingTime || !closingTime) {
    console.warn(
      `Could not parse shop hours: opening=${opening}, closing=${closing}`
    );
    return true;
  }

  const openingMinutes = openingTime.hours * 60 + openingTime.minutes;
  const closingMinutes = closingTime.hours * 60 + closingTime.minutes;

  if (closingMinutes < openingMinutes) {
    return currentMinutes >= openingMinutes || currentMinutes <= closingMinutes;
  }

  return currentMinutes >= openingMinutes && currentMinutes <= closingMinutes;
}

export function formatOperatingHours(opening: string, closing: string): string {
  return `${opening} - ${closing}`;
}

export function getShopHoursStatus(
  opening: string,
  closing: string
): { isOpen: boolean; label: string; color: string } {
  const isOpen = isShopOpen(opening, closing);

  if (isOpen) {
    return {
      isOpen: true,
      label: "Open Now",
      color: "text-green-600",
    };
  }

  const now = new Date();
  const openingTime = parseTimeString(opening);

  if (openingTime) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openingMinutes = openingTime.hours * 60 + openingTime.minutes;

    if (currentMinutes < openingMinutes) {
      return {
        isOpen: false,
        label: `Opens at ${opening}`,
        color: "text-orange-600",
      };
    }
  }

  return {
    isOpen: false,
    label: "Closed",
    color: "text-red-600",
  };
}
