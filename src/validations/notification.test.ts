import { describe, expect, it } from "vitest";

import { getNotificationsSchema } from "./notification";

describe("getNotificationsSchema", () => {
  it("defaults the limit to 10", () => {
    expect(getNotificationsSchema.parse({})).toEqual({ limit: 10 });
  });

  it("coerces the limit and accepts a cuid cursor", () => {
    expect(
      getNotificationsSchema.parse({
        limit: "3",
        cursor: "cjld2cjxh0000qzrmn831i7rn",
      })
    ).toEqual({ limit: 3, cursor: "cjld2cjxh0000qzrmn831i7rn" });
  });

  it.each([[{ limit: 0 }], [{ limit: "abc" }], [{ cursor: "%%" }]])(
    "rejects %j",
    (input) => {
      expect(getNotificationsSchema.safeParse(input).success).toBe(false);
    }
  );
});
