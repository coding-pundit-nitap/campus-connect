// Rules for the admin action helpers that the admin dashboards rely on.
import { describe, expect, it } from "vitest";

import { groupCount } from "./_shared";

describe("groupCount: a Prisma groupBy _count row read as a number", () => {
  it("reads the count for the key", () => {
    expect(groupCount({ id: 3 }, "id")).toBe(3);
  });

  it("is 0 when the key is missing", () => {
    expect(groupCount({ other: 3 }, "id")).toBe(0);
  });

  it.each([null, undefined, 0, 7, "", "abc", true])(
    "is 0 for a non-object _count (%s), never a property of a primitive",
    (count) => {
      expect(groupCount(count, "length")).toBe(0);
      expect(groupCount(count, "id")).toBe(0);
    }
  );
});
