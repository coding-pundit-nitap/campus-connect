import { expectError } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import { shopRepository } from "@/di/container";
import authUtils from "@/lib/utils/auth.utils.server";

import { resolveVendorShop } from "./vendor-shop";

const auth = vi.mocked(authUtils);
const shops = vi.mocked(shopRepository);

describe("resolveVendorShop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserData.mockResolvedValue({ id: "u1" } as never);
  });

  it("returns the id of the shop the user owns", async () => {
    shops.findByOwnerId.mockResolvedValue({ id: "shop-1" } as never);

    expect(await resolveVendorShop()).toEqual({ shopId: "shop-1" });
    expect(shops.findByOwnerId).toHaveBeenCalledWith("u1", {
      select: { id: true },
    });
  });

  it("returns a 401 response when the user has no id", async () => {
    auth.getUserData.mockResolvedValue({ id: "" } as never);

    const { error } = await resolveVendorShop();

    await expectError(error!, 401, "Not authorized");
    expect(shops.findByOwnerId).not.toHaveBeenCalled();
  });

  it("returns a 403 response when the user owns no shop (not a vendor)", async () => {
    shops.findByOwnerId.mockResolvedValue(null as never);

    const { error } = await resolveVendorShop();

    await expectError(error!, 403, "Forbidden: you don't own a shop");
  });

  it("propagates auth failures", async () => {
    auth.getUserData.mockRejectedValue(new Error("Unauthenticated"));

    await expect(resolveVendorShop()).rejects.toThrow("Unauthenticated");
  });
});
