import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/client";

import { convertPrismaDecimals } from "./prisma-serializer";

const PrismaDecimal = Prisma.Decimal;

describe("convertPrismaDecimals", () => {
  it.each([
    [null, null],
    [undefined, undefined],
    [42, 42],
    ["text", "text"],
    [true, true],
  ])("passes primitive %j through", (input, expected) => {
    expect(convertPrismaDecimals(input)).toBe(expected);
  });

  it("converts a Decimal to its string form", () => {
    expect(convertPrismaDecimals(new PrismaDecimal("12.50"))).toBe("12.5");
  });

  it("converts a Date to an ISO string", () => {
    expect(convertPrismaDecimals(new Date("2026-01-01T00:00:00.000Z"))).toBe(
      "2026-01-01T00:00:00.000Z"
    );
  });

  it("recurses through arrays and nested objects", () => {
    const input = {
      price: new PrismaDecimal("9.99"),
      items: [{ fee: new PrismaDecimal("1") }, { when: new Date(0) }],
      meta: { label: "x" },
    };

    expect(convertPrismaDecimals(input)).toEqual({
      price: "9.99",
      items: [{ fee: "1" }, { when: "1970-01-01T00:00:00.000Z" }],
      meta: { label: "x" },
    });
  });

  it("falls back to String() when a Decimal-like toString throws", () => {
    class Decimal {
      toString(): string {
        throw new Error("nope");
      }
      [Symbol.toPrimitive]() {
        return "fallback";
      }
    }

    expect(convertPrismaDecimals(new Decimal())).toBe("fallback");
  });

  it("uses toJSON of class instances that serialise to a primitive", () => {
    class Money {
      toJSON() {
        return "₹5";
      }
    }
    class Missing {
      toJSON() {
        return null;
      }
    }

    expect(convertPrismaDecimals(new Money())).toBe("₹5");
    expect(convertPrismaDecimals(new Missing())).toBeNull();
  });

  it("recurses into own fields when toJSON returns an object", () => {
    class Wrapper {
      amount = new PrismaDecimal("3");
      toJSON() {
        return { ignored: true };
      }
    }

    expect(convertPrismaDecimals(new Wrapper())).toEqual({
      amount: "3",
      toJSON: undefined,
    });
  });

  it("recurses into own fields when toJSON throws", () => {
    class Broken {
      value = 1;
      toJSON() {
        throw new Error("bad");
      }
    }

    expect(convertPrismaDecimals(new Broken())).toEqual({ value: 1 });
  });

  it("ignores toJSON on plain objects", () => {
    const plain = { toJSON: () => "should-not-be-used", a: 1 };

    const result = convertPrismaDecimals(plain) as Record<string, unknown>;

    expect(result.a).toBe(1);
    expect(typeof result.toJSON).toBe("function");
  });

  it("recurses into null-prototype objects", () => {
    const bare = Object.assign(Object.create(null), {
      n: new PrismaDecimal("2"),
    });

    expect(convertPrismaDecimals(bare)).toEqual({ n: "2" });
  });
});
