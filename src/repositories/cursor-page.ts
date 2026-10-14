/**
 * Splits a `take: limit + 1` result into one page plus the cursor for the
 * next page. Queries pair this with `cursor: { id }, skip: 1`, so the cursor
 * must be the LAST ROW RETURNED. Using the probe row's id would make the next
 * page skip that row.
 */
export function toCursorPage<T extends { id: string }>(
  rows: T[],
  limit: number
): { items: T[]; nextCursor: string | undefined } {
  if (rows.length <= limit) return { items: rows, nextCursor: undefined };
  const items = rows.slice(0, limit);
  return { items, nextCursor: items[items.length - 1]?.id };
}
