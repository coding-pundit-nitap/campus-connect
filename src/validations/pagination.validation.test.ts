import { describe, expect, it } from "vitest";

import {
  cursorPaginationSchema,
  dateRangeSchema,
  parseDate,
} from "./pagination.validation";

describe("cursorPaginationSchema", () => {
  it.each<[string | undefined, number]>([
    [undefined, 20],
    ["", 20],
    ["10", 10],
    ["0", 1],
    ["-5", 1],
    ["500", 50],
  ])("limit %j -> %i", (limit, expected) => {
    expect(cursorPaginationSchema.parse({ limit }).limit).toBe(expected);
  });

  it("rejects a non-numeric limit", () => {
    expect(
      cursorPaginationSchema.safeParse({ limit: "abc" }).error?.issues[0]
        ?.message
    ).toBe("limit must be a number");
  });

  it("passes the cursor through", () => {
    expect(cursorPaginationSchema.parse({ cursor: "c1" }).cursor).toBe("c1");
  });
});

describe("dateRangeSchema", () => {
  it.each([
    [{}],
    [{ date_from: "2026-01-01" }],
    [{ date_to: "2026-01-01" }],
    [{ date_from: "2026-01-01", date_to: "2026-01-01" }],
    [{ date_from: "2026-01-01", date_to: "2026-02-01" }],
  ])("accepts %j", (input) => {
    expect(dateRangeSchema.safeParse(input).success).toBe(true);
  });

  it("rejects an inverted range on date_from", () => {
    expect(
      dateRangeSchema.safeParse({
        date_from: "2026-02-01",
        date_to: "2026-01-01",
      }).error?.issues[0]
    ).toMatchObject({
      path: ["date_from"],
      message: "date_from must be before date_to",
    });
  });
});

describe("parseDate", () => {
  it.each<[string | undefined, Date | undefined]>([
    [undefined, undefined],
    ["", undefined],
    ["not a date", undefined],
    ["2026-01-02T00:00:00.000Z", new Date("2026-01-02T00:00:00.000Z")],
  ])("%j -> %j", (input, expected) => {
    expect(parseDate(input)).toEqual(expected);
  });
});
