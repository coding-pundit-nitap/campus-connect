import { describe, expect, it } from "vitest";

import {
  formatOrderAge,
  getOrderAgeUrgency,
  getOrderStatusLabel,
} from "./order-display";

const NOW = new Date("2026-08-12T12:00:00Z");
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);

describe("getOrderStatusLabel", () => {
  it("maps every status to its canonical label", () => {
    expect(getOrderStatusLabel("NEW")).toBe("New");
    expect(getOrderStatusLabel("BATCHED")).toBe("Accepted");
    expect(getOrderStatusLabel("RESCHEDULED")).toBe("Rescheduled");
    expect(getOrderStatusLabel("OUT_FOR_DELIVERY")).toBe("Out for Delivery");
    expect(getOrderStatusLabel("DELIVERY_FAILED")).toBe("Delivery Failed");
    expect(getOrderStatusLabel("COMPLETED")).toBe("Delivered");
    expect(getOrderStatusLabel("CANCELLED")).toBe("Cancelled");
  });
});

describe("formatOrderAge", () => {
  it("shows 'Just now' under a minute", () => {
    expect(formatOrderAge(minutesAgo(0), NOW)).toBe("Just now");
  });

  it("shows singular minute at exactly one minute", () => {
    expect(formatOrderAge(minutesAgo(1), NOW)).toBe("1 min ago");
  });

  it("shows plural minutes under an hour", () => {
    expect(formatOrderAge(minutesAgo(12), NOW)).toBe("12 min ago");
  });

  it("switches to hours at 60 minutes", () => {
    expect(formatOrderAge(minutesAgo(60), NOW)).toBe("1 hr ago");
    expect(formatOrderAge(minutesAgo(150), NOW)).toBe("2 hr ago");
  });

  it("accepts an ISO string as well as a Date", () => {
    expect(formatOrderAge(minutesAgo(5).toISOString(), NOW)).toBe("5 min ago");
  });
});

describe("getOrderAgeUrgency", () => {
  it("escalates faster for food than retail", () => {
    expect(getOrderAgeUrgency(minutesAgo(3), true, NOW)).toBe("normal");
    expect(getOrderAgeUrgency(minutesAgo(7), true, NOW)).toBe("warning");
    expect(getOrderAgeUrgency(minutesAgo(20), true, NOW)).toBe("critical");
  });

  it("uses gentler thresholds for retail, which has no freshness pressure", () => {
    expect(getOrderAgeUrgency(minutesAgo(7), false, NOW)).toBe("normal");
    expect(getOrderAgeUrgency(minutesAgo(20), false, NOW)).toBe("warning");
    expect(getOrderAgeUrgency(minutesAgo(40), false, NOW)).toBe("critical");
  });
});
