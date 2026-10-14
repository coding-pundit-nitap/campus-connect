import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatOperatingHours,
  getShopHoursStatus,
  isShopOpen,
  parseTimeString,
} from "./shop-hours";

const at = (hh: number, mm: number) =>
  vi.setSystemTime(new Date(2026, 0, 1, hh, mm));

describe("parseTimeString", () => {
  it.each<[string, { hours: number; minutes: number } | null]>([
    ["09:30", { hours: 9, minutes: 30 }],
    ["9:30", { hours: 9, minutes: 30 }],
    ["00:00", { hours: 0, minutes: 0 }],
    ["23:59", { hours: 23, minutes: 59 }],
    ["24:00", null],
    ["12:60", null],
    ["9:5", null],
    ["noon", null],
    ["", null],
  ])("%j -> %j", (input, expected) => {
    expect(parseTimeString(input)).toEqual(expected);
  });
});

describe("shop hours (clock-dependent)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isShopOpen", () => {
    it.each([
      [8, 59, false],
      [9, 0, true],
      [21, 0, true],
      [21, 1, false],
    ])("09:00-21:00 at %i:%i -> %s", (hh, mm, expected) => {
      at(hh, mm);

      expect(isShopOpen("09:00", "21:00")).toBe(expected);
    });

    it.each([
      [21, 59, false],
      [23, 0, true],
      [1, 0, true],
      [2, 1, false],
    ])("overnight 22:00-02:00 at %i:%i -> %s", (hh, mm, expected) => {
      at(hh, mm);

      expect(isShopOpen("22:00", "02:00")).toBe(expected);
    });

    it.each([
      ["bad", "21:00"],
      ["09:00", "bad"],
    ])("treats unparsable hours (%s, %s) as open", (opening, closing) => {
      at(3, 0);

      expect(isShopOpen(opening, closing)).toBe(true);
    });
  });

  describe("getShopHoursStatus", () => {
    it("is open during hours", () => {
      at(10, 0);

      expect(getShopHoursStatus("09:00", "21:00")).toEqual({
        isOpen: true,
        label: "Open Now",
        color: "text-green-600",
      });
    });

    it("announces the opening time before opening", () => {
      at(7, 0);

      expect(getShopHoursStatus("09:00", "21:00")).toEqual({
        isOpen: false,
        label: "Opens at 09:00",
        color: "text-orange-600",
      });
    });

    it("is closed after closing", () => {
      at(22, 0);

      expect(getShopHoursStatus("09:00", "21:00")).toEqual({
        isOpen: false,
        label: "Closed",
        color: "text-red-600",
      });
    });
  });
});

describe("formatOperatingHours", () => {
  it("joins opening and closing", () => {
    expect(formatOperatingHours("09:00", "21:00")).toBe("09:00 - 21:00");
  });
});
