import { beforeEach, describe, expect, it, vi } from "vitest";

import { cartRepository } from "@/di/container";
import {
  InternalServerError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { serializeFullCart } from "@/lib/utils";
import authUtils from "@/lib/utils/auth.utils.server";

import { upsertCartItem } from "./cart-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/utils", () => ({
  serializeFullCart: vi.fn(() => ({ serialized: true })),
}));

const auth = vi.mocked(authUtils);

describe("upsertCartItem", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(serializeFullCart).mockReturnValue({ serialized: true } as never);
    auth.getUserId.mockResolvedValue("user-1");
  });

  it("upserts the item for the current user and returns the serialized cart", async () => {
    vi.mocked(cartRepository.upsertItemForUser).mockResolvedValue({
      id: "cart-1",
    } as never);

    const res = await upsertCartItem({ product_id: "p1", quantity: 2 });

    expect(cartRepository.upsertItemForUser).toHaveBeenCalledWith(
      "user-1",
      "p1",
      2
    );
    expect(serializeFullCart).toHaveBeenCalledWith({ id: "cart-1" });
    expect(res).toEqual({ serialized: true });
  });

  it("throws UnauthorizedError without a user", async () => {
    auth.getUserId.mockResolvedValue("");

    await expect(
      upsertCartItem({ product_id: "p1", quantity: 1 })
    ).rejects.toThrow(new UnauthorizedError("User not authenticated"));
  });

  it("rethrows UnauthenticatedError", async () => {
    auth.getUserId.mockRejectedValue(new UnauthenticatedError());

    await expect(
      upsertCartItem({ product_id: "p1", quantity: 1 })
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("wraps invalid input in an InternalServerError", async () => {
    await expect(
      upsertCartItem({ product_id: "", quantity: -1 } as never)
    ).rejects.toThrow(new InternalServerError("Failed to update cart item"));
    expect(cartRepository.upsertItemForUser).not.toHaveBeenCalled();
  });
});
