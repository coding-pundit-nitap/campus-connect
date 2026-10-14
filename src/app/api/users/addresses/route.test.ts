import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import { userAddressRepository } from "@/di/container";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const addresses = vi.mocked(userAddressRepository);

describe("GET /api/users/addresses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("returns the user's addresses", async () => {
    addresses.findByUserId.mockResolvedValue([{ id: "a1" }] as never);

    expect(await expectSuccess(await GET())).toEqual([{ id: "a1" }]);
    expect(addresses.findByUserId).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 with an empty user id", async () => {
    auth.getUserId.mockResolvedValue("");

    await expectError(await GET(), 401, "Unauthorized");
  });

  it("returns 500 when the lookup fails", async () => {
    addresses.findByUserId.mockRejectedValue(new Error("db"));

    await expectError(await GET(), 500, "Internal Server Error");
  });
});
