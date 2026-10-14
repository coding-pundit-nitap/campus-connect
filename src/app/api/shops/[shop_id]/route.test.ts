import { makeRequest, routeParams } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/shop-utils", async () =>
  (await import("@tests/helpers/api")).shopUtilsModule()
);

import { shopRepository } from "@/di/container";

import { GET } from "./route";

const shops = vi.mocked(shopRepository);
const get = () =>
  GET(makeRequest("/api/shops/s1"), routeParams({ shop_id: "s1" }));

describe("GET /api/shops/[shop_id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the formatted shop", async () => {
    shops.findById.mockResolvedValue({ id: "s1" } as never);

    expect(await expectSuccess(await get())).toEqual({
      id: "s1",
      serialized: true,
    });
    expect(shops.findById).toHaveBeenCalledWith("s1", expect.any(Object));
  });

  it("returns 404 when the shop does not exist", async () => {
    shops.findById.mockResolvedValue(null as never);

    await expectError(await get(), 404, "Shop not found");
  });

  it("returns 500 when the lookup fails", async () => {
    shops.findById.mockRejectedValue(new Error("db"));

    await expectError(await get(), 500, "An internal server error occurred.");
  });
});
