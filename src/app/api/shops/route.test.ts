import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/shop-utils", async () =>
  (await import("@tests/helpers/api")).shopUtilsModule()
);

import { shopRepository } from "@/di/container";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const shops = vi.mocked(shopRepository);

describe("GET /api/shops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("returns the caller's formatted shop", async () => {
    shops.findByOwnerId.mockResolvedValue({ id: "s1" } as never);

    expect(await expectSuccess(await GET())).toEqual({
      id: "s1",
      serialized: true,
    });
    expect(shops.findByOwnerId).toHaveBeenCalledWith("user-1", {
      include: { user: { select: { name: true, email: true } } },
    });
  });

  it("returns null data when the caller has no shop", async () => {
    shops.findByOwnerId.mockResolvedValue(null as never);

    expect(await expectSuccess(await GET())).toBeNull();
  });

  it("returns 401 with an empty user id", async () => {
    auth.getUserId.mockResolvedValue("");

    await expectError(await GET(), 401, "User not authenticated");
  });

  it("returns 500 when the repository fails", async () => {
    shops.findByOwnerId.mockRejectedValue(new Error("db"));

    await expectError(await GET(), 500, "Internal Server Error");
  });
});
