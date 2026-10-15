import { describe, expect, it, vi } from "vitest";

import { paginateCursor } from "@/lib/paginate";

describe("paginateCursor", () => {
  it("requests limit + 1 rows and forwards the cursor to the fetcher", async () => {
    const fetcher = vi.fn().mockResolvedValue([]);

    await paginateCursor(fetcher, 10, "abc");

    expect(fetcher).toHaveBeenCalledWith({ take: 11, cursor: "abc" });
  });

  it("reports no more pages when the fetcher returns limit or fewer rows", async () => {
    const rows = [{ id: "1" }, { id: "2" }];
    const fetcher = vi.fn().mockResolvedValue(rows);

    const result = await paginateCursor(fetcher, 10);

    expect(result).toEqual({ data: rows, nextCursor: null, hasMore: false });
  });

  it("reports no more pages when exactly limit rows are returned", async () => {
    const rows = [{ id: "1" }, { id: "2" }];
    const fetcher = vi.fn().mockResolvedValue(rows);

    const result = await paginateCursor(fetcher, 2);

    expect(result).toEqual({ data: rows, nextCursor: null, hasMore: false });
  });

  it("drops the look-ahead row and uses the last returned row as the next cursor", async () => {
    const rows = [{ id: "1" }, { id: "2" }, { id: "3" }];
    const fetcher = vi.fn().mockResolvedValue(rows);

    const result = await paginateCursor(fetcher, 2);

    expect(result).toEqual({
      data: [{ id: "1" }, { id: "2" }],
      nextCursor: "2",
      hasMore: true,
    });
  });

  it("never skips a row when pages are fetched with cursor + skip: 1", async () => {
    const table = ["1", "2", "3", "4", "5"].map((id) => ({ id }));
    // Mirrors the Prisma callers: `cursor: { id }, skip: cursor ? 1 : 0`.
    const fetcher = async ({
      take,
      cursor,
    }: {
      take: number;
      cursor?: string;
    }) => {
      const start = cursor ? table.findIndex((r) => r.id === cursor) + 1 : 0;
      return table.slice(start, start + take);
    };

    const seen: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await paginateCursor(fetcher, 2, cursor);
      seen.push(...page.data.map((r) => r.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);

    expect(seen).toEqual(["1", "2", "3", "4", "5"]);
  });
});
