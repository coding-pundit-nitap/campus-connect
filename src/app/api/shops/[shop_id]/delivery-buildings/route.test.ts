import { makeRequest, routeParams } from "@tests/helpers";
import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);

import { prisma } from "@/lib/prisma";

import { GET } from "./route";

const db = asMock(prisma);
const get = () =>
  GET(
    makeRequest("/api/shops/s1/delivery-buildings"),
    routeParams({ shop_id: "s1" })
  );

describe("GET /api/shops/[shop_id]/delivery-buildings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the active buildings the shop delivers to", async () => {
    db.shopDeliveryBuilding.findMany.mockResolvedValue([
      { building: { id: "b1" } },
    ]);

    expect(await expectSuccess(await get())).toEqual([{ id: "b1" }]);
    expect(db.shopDeliveryBuilding.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          shop_id: "s1",
          is_active: true,
          building: { is_active: true },
        },
      })
    );
  });

  it("returns 500 when the query fails", async () => {
    db.shopDeliveryBuilding.findMany.mockRejectedValue(new Error("db"));

    await expectError(await get(), 500, "Failed to fetch delivery buildings");
  });
});
