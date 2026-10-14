import { makeRequest } from "@tests/helpers";
import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);

import { prisma } from "@/lib/prisma";

import { GET } from "./route";

const db = asMock(prisma);
const productFilter = () =>
  db.brand.findMany.mock.calls[0][0].where.products.some;

describe("GET /api/search/brands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.brand.findMany.mockResolvedValue([]);
  });

  it("returns non-blank brand names", async () => {
    db.brand.findMany.mockResolvedValue([
      { name: "Acme" },
      { name: "  " },
      { name: null },
      { name: "Zed" },
    ]);

    expect(
      await expectSuccess(await GET(makeRequest("/api/search/brands")))
    ).toEqual(["Acme", "Zed"]);
    expect(productFilter()).toEqual({
      deleted_at: null,
      shop: { is_active: true },
    });
  });

  it("restricts to a shop type when given", async () => {
    await GET(makeRequest("/api/search/brands?type=STATIONERY"));

    expect(productFilter().shop).toEqual({
      shop_type: "STATIONERY",
      is_active: true,
    });
  });

  it("returns 500 when the query fails", async () => {
    db.brand.findMany.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/search/brands")),
      500,
      "Failed to fetch brands"
    );
  });
});
