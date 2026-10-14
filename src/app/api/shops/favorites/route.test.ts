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
const get = (query = "") => GET(makeRequest(`/api/shops/favorites${query}`));

const shop = {
  id: "s1",
  name: "Shop",
  image_key: "k",
  location: "Block A",
  is_active: true,
  opening: "09:00",
  closing: "21:00",
};

describe("GET /api/shops/favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it.each([
    [{ id: "f1" }, true],
    [null, false],
  ])("reports favorite status for one shop (%o)", async (row, expected) => {
    db.favoriteShop.findUnique.mockResolvedValue(row);

    expect(await expectSuccess(await get("?shop_id=s1"))).toBe(expected);
    expect(db.favoriteShop.findUnique).toHaveBeenCalledWith({
      where: { user_id_shop_id: { user_id: "user-1", shop_id: "s1" } },
    });
  });

  it("lists favorites, dropping deleted shops", async () => {
    db.favoriteShop.findMany.mockResolvedValue([
      { id: "f1", shop: { ...shop, deleted_at: null } },
      { id: "f2", shop: { ...shop, id: "s2", deleted_at: new Date() } },
    ]);

    expect(await expectSuccess(await get())).toEqual([{ id: "f1", shop }]);
  });

  it("answers false for a shop check with an empty user id", async () => {
    auth.getUserId.mockResolvedValue("");

    expect(await expectSuccess(await get("?shop_id=s1"))).toBe(false);
  });

  it("returns 401 for the list with an empty user id", async () => {
    auth.getUserId.mockResolvedValue("");

    await expectError(await get(), 401, "Unauthorized");
  });

  it("answers false (not an error) for a shop check when signed out", async () => {
    auth.getUserId.mockRejectedValue(new UnauthenticatedError());

    expect(await expectSuccess(await get("?shop_id=s1"))).toBe(false);
    expect(db.favoriteShop.findUnique).not.toHaveBeenCalled();
  });

  it("returns 401 for the list when signed out", async () => {
    auth.getUserId.mockRejectedValue(new UnauthenticatedError());

    await expectError(await get(), 401, "Unauthorized");
  });

  it("returns 500 when auth throws", async () => {
    auth.getUserId.mockRejectedValue(new Error("Unauthenticated"));

    await expectError(await get(), 500, "Internal Server Error");
  });
});
