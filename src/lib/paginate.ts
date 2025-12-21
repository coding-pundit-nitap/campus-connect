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
    const last = rows.pop()!;
    nextCursor = last.id;
  }

  return {
    data: rows,
    nextCursor,
    hasMore: nextCursor !== null,
  };
}
