import { CursorPaginatedResponse } from "@/types";

export async function paginateCursor<T extends { id: string }>(
  fetcher: (args: { take: number; cursor?: string }) => Promise<T[]>,
  limit: number,
  cursor?: string
): Promise<CursorPaginatedResponse<T>> {
  const rows = await fetcher({
    take: limit + 1,
    cursor,
  });

  let nextCursor: string | null = null;

  if (rows.length > limit) {
    // Drop the look-ahead row, then point the cursor at the last row we
    // actually return. Callers query with `cursor: { id }, skip: 1`, so the
    // next page starts right after it; using the dropped row's id would make
    // that row disappear from every page.
    rows.pop();
    nextCursor = rows[rows.length - 1].id;
  }

  return {
    data: rows,
    nextCursor,
    hasMore: nextCursor !== null,
  };
}
