import { readJson } from "@tests/helpers";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/client";

import * as prismaSerializer from "./prisma-serializer";
import { jsonResponse } from "./response-serializer";

describe("jsonResponse", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("serialises Decimals and defaults to status 200", async () => {
    const res = jsonResponse({ total: new Prisma.Decimal("10.5") });

    await expect(readJson(res)).resolves.toEqual({
      status: 200,
      body: { total: "10.5" },
    });
  });

  it("uses the supplied status", async () => {
    const res = jsonResponse({ error: "nope" }, 404);

    expect(res.status).toBe(404);
  });

  it("falls back to the raw body when normalisation throws", async () => {
    vi.spyOn(prismaSerializer, "convertPrismaDecimals").mockImplementation(
      () => {
        throw new Error("boom");
      }
    );

    const res = jsonResponse({ ok: true }, 201);

    await expect(readJson(res)).resolves.toEqual({
      status: 201,
      body: { ok: true },
    });
  });
});
