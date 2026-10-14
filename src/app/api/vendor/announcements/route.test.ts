import { makeRequest } from "@tests/helpers";
import { asMock, expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import {
  ForbiddenError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const db = asMock(prisma);
const get = () => GET(makeRequest("/api/vendor/announcements"));

const row = (product: { name: string } | null) => ({
  id: "a1",
  title: "T",
  message: "M",
  expires_at: new Date("2026-01-02T00:00:00Z"),
  created_at: new Date("2026-01-01T00:00:00Z"),
  product,
});

describe("GET /api/vendor/announcements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getOwnedShopId.mockResolvedValue("shop-1");
  });

  it("returns the shop's announcements serialized", async () => {
    db.shopAnnouncement.findMany.mockResolvedValue([
      row({ name: "Tea" }),
      row(null),
    ]);

    const data = await expectSuccess<{ product_name: string | null }[]>(
      await get()
    );

    expect(data[0]).toEqual({
      id: "a1",
      title: "T",
      message: "M",
      expires_at: "2026-01-02T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
      product_name: "Tea",
    });
    expect(data[1].product_name).toBeNull();
    expect(db.shopAnnouncement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { shop_id: "shop-1" } })
    );
  });

  it("returns 401 with an empty shop id", async () => {
    auth.getOwnedShopId.mockResolvedValue("");

    await expectError(await get(), 401, "Unauthorized");
  });

  it.each([
    [new UnauthenticatedError(), 401, "Unauthorized"],
    [new UnauthorizedError(), 403, "Forbidden"],
    [new ForbiddenError(), 403, "Forbidden"],
    [new Error("db"), 500, "Failed to fetch vendor announcements"],
  ])("maps %s to %d", async (error, status, details) => {
    auth.getOwnedShopId.mockRejectedValue(error);

    await expectError(await get(), status, details);
  });
});
