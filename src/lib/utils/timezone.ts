export const APP_TIME_ZONE = "Asia/Kolkata";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function asNumber(value: string | undefined, label: string): number {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Failed to parse ${label} from Intl parts`);
  }
  return num;
}

export function getZonedParts(
  date: Date,
  timeZone: string = APP_TIME_ZONE
): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  return {
    year: asNumber(map.year, "year"),
    month: asNumber(map.month, "month"),
    day: asNumber(map.day, "day"),
    hour: asNumber(map.hour, "hour"),
    minute: asNumber(map.minute, "minute"),
    second: asNumber(map.second, "second"),
  };
}

export function getTimeZoneOffsetMs(
  date: Date,
  timeZone: string = APP_TIME_ZONE
): number {
  const zoned = getZonedParts(date, timeZone);
  const asIfUtc = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second
  );
  return asIfUtc - date.getTime();
}

export function zonedPartsToUtcDate(
  parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second?: number;
  },
  timeZone: string = APP_TIME_ZONE
): Date {
  const second = parts.second ?? 0;
  const utcGuessMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    second
  );

  const offset1 = getTimeZoneOffsetMs(new Date(utcGuessMs), timeZone);
  let utcMs = utcGuessMs - offset1;

  const offset2 = getTimeZoneOffsetMs(new Date(utcMs), timeZone);
  if (offset2 !== offset1) {
    utcMs = utcGuessMs - offset2;
  }

  return new Date(utcMs);
}

export function addZonedDays(
  dateParts: { year: number; month: number; day: number },
  days: number,
  timeZone: string = APP_TIME_ZONE
): { year: number; month: number; day: number } {
  const start = zonedPartsToUtcDate(
    { ...dateParts, hour: 0, minute: 0, second: 0 },
    timeZone
  );
  const next = new Date(start.getTime() + days * 86400000);
  const nextParts = getZonedParts(next, timeZone);
  return { year: nextParts.year, month: nextParts.month, day: nextParts.day };
}
