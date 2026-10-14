import { describe, expect, it } from "vitest";

import { toCursorPage } from "./cursor-page";

const rows = (...ids: string[]) => ids.map((id) => ({ id }));

describe("toCursorPage", () => {
  it.each([
    ["fewer rows than the limit", rows("a"), 2],
    ["exactly the limit", rows("a", "b"), 2],
    ["no rows", rows(), 2],
  ])("returns every row and no cursor for %s", (_label, input, limit) => {
    expect(toCursorPage(input, limit)).toEqual({
      items: input,
      nextCursor: undefined,
    });
  });

  it("trims the look-ahead row and points the cursor at the last row returned", () => {
    expect(toCursorPage(rows("a", "b", "c"), 2)).toEqual({
      items: rows("a", "b"),
      nextCursor: "b",
    });
  });

  it("does not mutate the input array", () => {
    const input = rows("a", "b", "c");
    toCursorPage(input, 2);
    expect(input).toHaveLength(3);
  });

  it("pages through a dataset with cursor+skip:1 without losing rows", () => {
    const all = rows("1", "2", "3", "4", "5");
    // Emulates Prisma: start after `cursor` (skip: 1), take limit + 1.
    const query = (cursor: string | undefined, take: number) => {
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + take);
    };
    const seen: string[] = [];
    let cursor: string | undefined;
    do {
      const page = toCursorPage(query(cursor, 3), 2);
      seen.push(...page.items.map((r) => r.id));
      cursor = page.nextCursor;
    } while (cursor);
    expect(seen).toEqual(["1", "2", "3", "4", "5"]);
  });
});
