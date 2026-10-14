import { makeRequest } from "@tests/helpers";
import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import { UnauthenticatedError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const db = asMock(prisma);
const get = (query = "") =>
  GET(makeRequest(`/api/products/stock-watch${query}`));

const watch = (id: string, deleted_at: Date | null) => ({
  id,
  product: {
    id: `p-${id}`,
    name: "Pen",
    price: { toString: () => "12.50" },
    image_key: "k",
    stock_quantity: 0,
    deleted_at,
    shop: { name: "Shop" },
  },
});

describe("GET /api/products/stock-watch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it.each([
    [{ id: "w1" }, true],
    [null, false],
  ])("reports watch status for one product (%o)", async (row, expected) => {
    db.stockWatch.findUnique.mockResolvedValue(row);

    expect(await expectSuccess(await get("?product_id=p1"))).toBe(expected);
    expect(db.stockWatch.findUnique).toHaveBeenCalledWith({
      where: { user_id_product_id: { user_id: "user-1", product_id: "p1" } },
    });
  });

  it("lists watches, dropping deleted products", async () => {
    db.stockWatch.findMany.mockResolvedValue([
      watch("w1", null),
      watch("w2", new Date()),
    ]);

    expect(await expectSuccess(await get())).toEqual([
      {
        id: "w1",
        product: {
          id: "p-w1",
          name: "Pen",
          price: "12.50",
          image_key: "k",
          stock_quantity: 0,
          shop: { name: "Shop" },
        },
      },
    ]);
  });

  it("answers false (not 401) for a product check when signed out", async () => {
    auth.getUserId.mockRejectedValue(new UnauthenticatedError());

    expect(await expectSuccess(await get("?product_id=p1"))).toBe(false);
  });

  it("returns 401 for the list when signed out", async () => {
    auth.getUserId.mockRejectedValue(new UnauthenticatedError());

    await expectError(await get(), 401, "Unauthorized");
  });

  it("returns 500 when auth fails unexpectedly", async () => {
    auth.getUserId.mockRejectedValue(new Error("redis down"));

    await expectError(await get(), 500, "Internal Server Error");
  });
});
