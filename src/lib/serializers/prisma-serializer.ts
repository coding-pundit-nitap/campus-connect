// Recursively convert Prisma Decimal instances to plain strings so
// Server Components don't pass non-plain objects to Client Components.
export function convertPrismaDecimals(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((v) => convertPrismaDecimals(v));
  }

  if (typeof value === "object") {
    const obj = value;

    const ctorName = value?.constructor?.name;
    if (ctorName === "Decimal") {
      try {
        return value.toString();
      } catch {
        return String(value);
      }
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = convertPrismaDecimals(v);
    }
    return out;
  }

  return value;
}
