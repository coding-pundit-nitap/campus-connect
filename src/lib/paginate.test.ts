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

  it("pops the extra row and reports the next cursor when there are more pages", async () => {
    const rows = [{ id: "1" }, { id: "2" }, { id: "3" }];
    const fetcher = vi.fn().mockResolvedValue(rows);

    const result = await paginateCursor(fetcher, 2);

    expect(result).toEqual({
      data: [{ id: "1" }, { id: "2" }],
      nextCursor: "3",
      hasMore: true,
    });
  });
});
