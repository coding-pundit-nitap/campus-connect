import { beforeEach, describe, expect, it, vi } from "vitest";

import { userAddressRepository, userRepository } from "@/di/container";
import {
  ForbiddenError,
  UnauthenticatedError,
  ValidationError,
} from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import {
  addUserAddress,
  deleteUserAddress,
  updateUser,
  updateUserAddress,
} from "./index";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

const auth = vi.mocked(authUtils);
const addresses = vi.mocked(userAddressRepository);
const address = { label: "Home", room_number: "101", building: " Hall " };

describe("user actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  describe("updateUser", () => {
    it("updates the current user with the validated fields", async () => {
      await updateUser({ name: "Alice", phone: "123" });

      expect(userRepository.update).toHaveBeenCalledWith("user-1", {
        name: "Alice",
        phone: "123",
      });
    });

    it("rejects invalid fields", async () => {
      await expect(updateUser({ name: "Al" })).rejects.toThrow(
        new ValidationError("Invalid fields")
      );
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("addUserAddress", () => {
    it("creates the address with a trimmed building for the current user", async () => {
      await addUserAddress(address as never);

      expect(addresses.create).toHaveBeenCalledWith({
        data: {
          ...address,
          is_default: false,
          building: "Hall",
          user_id: "user-1",
        },
      });
    });

    it("rejects invalid fields", async () => {
      await expect(addUserAddress({ label: "" } as never)).rejects.toThrow(
        new ValidationError("Invalid fields")
      );
    });

    it("requires a building name", async () => {
      await expect(
        addUserAddress({
          ...address,
          building: undefined,
          building_id: "b1",
        } as never)
      ).rejects.toThrow(new ValidationError("Building is required"));
      expect(addresses.create).not.toHaveBeenCalled();
    });
  });

  describe("updateUserAddress", () => {
    it("updates the address with ownership enforced by the repository", async () => {
      addresses.updateWithDefault.mockResolvedValue({ id: "addr-1" } as never);

      await updateUserAddress({ ...address, id: "addr-1" } as never);

      expect(addresses.updateWithDefault).toHaveBeenCalledWith(
        "addr-1",
        "user-1",
        expect.objectContaining({ building: "Hall", label: "Home" })
      );
    });

    it("rejects an address that is not the user's", async () => {
      addresses.updateWithDefault.mockResolvedValue(null);

      await expect(
        updateUserAddress({ ...address, id: "addr-1" } as never)
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("rejects invalid fields", async () => {
      await expect(updateUserAddress({ ...address } as never)).rejects.toThrow(
        new ValidationError("Invalid fields")
      );
    });

    it("requires a building name", async () => {
      await expect(
        updateUserAddress({
          ...address,
          id: "addr-1",
          building: undefined,
          building_id: "b1",
        } as never)
      ).rejects.toThrow(new ValidationError("Building is required"));
    });
  });

  describe("deleteUserAddress", () => {
    it("deletes the user's own address", async () => {
      auth.isAuthenticated.mockResolvedValue(true);
      addresses.deleteByIdAndUserId.mockResolvedValue({
        id: "addr-1",
      } as never);

      await deleteUserAddress("addr-1");

      expect(addresses.deleteByIdAndUserId).toHaveBeenCalledWith(
        "addr-1",
        "user-1"
      );
    });

    it("rejects an address that is not the user's", async () => {
      auth.isAuthenticated.mockResolvedValue(true);
      addresses.deleteByIdAndUserId.mockResolvedValue(null);

      await expect(deleteUserAddress("addr-1")).rejects.toBeInstanceOf(
        ForbiddenError
      );
    });

    it("rejects an unauthenticated caller", async () => {
      auth.isAuthenticated.mockResolvedValue(false);
      auth.unAuthenticated.mockImplementation(() => {
        throw new UnauthenticatedError();
      });

      await expect(deleteUserAddress("addr-1")).rejects.toBeInstanceOf(
        UnauthenticatedError
      );
      expect(addresses.deleteByIdAndUserId).not.toHaveBeenCalled();
    });
  });
});
