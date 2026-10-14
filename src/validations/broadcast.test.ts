import { describe, expect, it } from "vitest";

import { env } from "@/config/env.config";

import {
  broadcastFormSchema,
  paginatedSchema,
  searchSchema,
} from "./broadcast";

const CUID = "cjld2cjxh0000qzrmn831i7rn";

describe("paginatedSchema", () => {
  it("defaults the limit to DEFAULT_PAGE_SIZE", () => {
    expect(paginatedSchema.parse({})).toEqual({ limit: env.DEFAULT_PAGE_SIZE });
  });

  it("coerces string limits and accepts a cuid cursor", () => {
    expect(paginatedSchema.parse({ limit: "5", cursor: CUID })).toEqual({
      limit: 5,
      cursor: CUID,
    });
  });

  it.each([
    [{ limit: 0 }],
    [{ limit: -1 }],
    [{ limit: 1.5 }],
    [{ cursor: "not a cuid" }],
  ])("rejects %j", (input) => {
    expect(paginatedSchema.safeParse(input).success).toBe(false);
  });

  it("caps the limit at MAX_PAGE_SIZE", () => {
    const result = paginatedSchema.safeParse({ limit: env.MAX_PAGE_SIZE + 1 });

    expect(result.error?.issues[0]?.message).toBe(
      `Maximum ${env.MAX_PAGE_SIZE} items per page`
    );
  });
});

describe("searchSchema", () => {
  it("adds an optional search term", () => {
    expect(searchSchema.parse({ search: "tea" })).toMatchObject({
      search: "tea",
    });
    expect(searchSchema.parse({})).not.toHaveProperty("search");
  });
});

describe("broadcastFormSchema", () => {
  const valid = {
    title: "  Hello  ",
    message: " World ",
    type: "INFO",
    category: "SYSTEM",
  };

  it("trims title and message", () => {
    expect(broadcastFormSchema.parse(valid)).toMatchObject({
      title: "Hello",
      message: "World",
    });
  });

  it.each([
    [{ title: "" }, "Title is required"],
    [{ title: "x".repeat(201) }, "Title must be less than 200 characters"],
    [{ message: "" }, "Message is required"],
    [
      { message: "x".repeat(1001) },
      "Message must be less than 1000 characters",
    ],
  ])("rejects %j", (patch, message) => {
    expect(
      broadcastFormSchema.safeParse({ ...valid, ...patch }).error?.issues[0]
        ?.message
    ).toBe(message);
  });

  it.each([{ type: "NOPE" }, { category: "NOPE" }])(
    "rejects unknown enum %j",
    (patch) => {
      expect(
        broadcastFormSchema.safeParse({ ...valid, ...patch }).success
      ).toBe(false);
    }
  );
});
