// Recursively convert Prisma Decimal instances to plain strings so
// Server Components don't pass non-plain objects to Client Components.
export function convertPrismaDecimals<T>(value: T): T {
  if (value === null || value === undefined) return value;

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((v) => convertPrismaDecimals(v)) as T;
  }

  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toISOString() as T;
    }

    const obj = value as Record<string, unknown>;

    const ctorName = value?.constructor?.name;
    if (ctorName === "Decimal") {
      try {
        return value.toString() as T;
      } catch {
        return String(value) as T;
      }
    }
    if (
      "toJSON" in obj &&
      typeof obj.toJSON === "function" &&
      ctorName &&
      ctorName !== "Object"
    ) {
      try {
        const serialized = obj.toJSON();
        if (serialized === null || typeof serialized !== "object") {
          return serialized as T;
        }
      } catch {
        // Fall through to recursive conversion.
      }
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = convertPrismaDecimals(v);
    }
    return out as T;
  }

  return value;
}
