import { makeRequest } from "@tests/helpers";
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

describe("GET /api/shops/all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shops.getShops.mockResolvedValue([] as never);
  });

  it("returns a formatted page of active shops without owner e-mails", async () => {
    const user = { name: "Owner", email: "owner@example.com" };
    shops.getShops.mockResolvedValue([
      { id: "s1", user },
      { id: "s2", user },
    ] as never);

    expect(
      await expectSuccess(await GET(makeRequest("/api/shops/all?limit=1")))
    ).toEqual({
      data: [{ id: "s1", serialized: true, user: { name: "Owner" } }],
      nextCursor: "s1",
      hasMore: true,
    });
    expect(shops.getShops).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { is_active: true, deleted_at: null },
        take: 2,
        skip: 0,
        cursor: undefined,
      })
    );
  });

  it("continues after the cursor", async () => {
    await GET(makeRequest("/api/shops/all?cursor=s9"));

    expect(shops.getShops).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: "s9" }, skip: 1 })
    );
  });

  it("returns 400 for a non-numeric limit", async () => {
    await expectError(
      await GET(makeRequest("/api/shops/all?limit=x")),
      400,
      "limit must be a number"
    );
  });

  it("returns 500 when the repository fails", async () => {
    shops.getShops.mockRejectedValue(new Error("db"));

    await expectError(
      await GET(makeRequest("/api/shops/all")),
      500,
      "An internal server error occurred."
    );
  });
});
