import { type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { userAddressRepository } from "@/di/container";
import { ForbiddenError, InternalServerError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  updateAddressAction,
} from "./user-address-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("@tests/helpers")).createPrismaMock(),
}));

const auth = vi.mocked(authUtils);
const repo = vi.mocked(userAddressRepository);
const db = prisma as unknown as PrismaMock;
const address = { id: "addr-1" };

const base = { label: "Home", room_number: "101", is_default: true };

describe("user-address-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
  });

  describe("createAddressAction", () => {
    it("connects a selected active building and copies its name", async () => {
      db.building.findFirst.mockResolvedValue({
        id: "b1",
        name: "Hall",
        hostel_block: null,
      });
      repo.createWithDefault.mockResolvedValue(address as never);

      const res = await createAddressAction({ ...base, building_id: "b1" });

      expect(db.building.findFirst).toHaveBeenCalledWith({
        where: { id: "b1", is_active: true },
      });
      expect(repo.createWithDefault).toHaveBeenCalledWith(
        {
          ...base,
          building: "Hall",
          hostel_block: undefined,
          building_ref: { connect: { id: "b1" } },
          user: { connect: { id: "user-1" } },
        },
        "user-1"
      );
      expect(res).toMatchObject({
        data: address,
        details: "Address created successfully!",
      });
    });

    // Regression: the free-text path used to overwrite building_ref with
    // `{ connect: { id: undefined } }`, so Prisma rejected every such address.
    it("connects the building found by a typed name", async () => {
      db.building.findFirst.mockResolvedValue({ id: "b7" });

      await createAddressAction({
        ...base,
        building: " Hall ",
        hostel_block: " A ",
      });

      expect(db.building.findFirst).toHaveBeenCalledWith({
        where: {
          name: { equals: "Hall", mode: "insensitive" },
          hostel_block: "A",
        },
      });
      expect(db.building.create).not.toHaveBeenCalled();
      expect(repo.createWithDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          building: "Hall",
          hostel_block: "A",
          building_ref: { connect: { id: "b7" } },
        }),
        "user-1"
      );
    });

    it("creates a building for an unknown typed name", async () => {
      db.building.findFirst.mockResolvedValue(null);
      db.building.create.mockResolvedValue({ id: "b9" });

      await createAddressAction({ ...base, building: "New Hall" });

      expect(db.building.create).toHaveBeenCalledWith({
        data: { name: "New Hall", hostel_block: null },
      });
      const [data] = repo.createWithDefault.mock.calls[0];
      expect(data).toMatchObject({
        building_ref: { connect: { id: "b9" } },
        hostel_block: undefined,
      });
      expect(data).not.toHaveProperty("building_id");
    });

    it.each([
      [
        "an inactive selected building",
        { building_id: "b1" },
        "Selected building is not available.",
      ],
      ["no building at all", { building: "  " }, "Building is required."],
    ])("rejects %s with a ForbiddenError", async (_case, extra, message) => {
      db.building.findFirst.mockResolvedValue(null);

      await expect(createAddressAction({ ...base, ...extra })).rejects.toThrow(
        new ForbiddenError(message)
      );
      expect(repo.createWithDefault).not.toHaveBeenCalled();
    });

    it.each([
      ["no user", () => auth.getUserId.mockResolvedValue("")],
      [
        "a database failure",
        () => db.building.findFirst.mockRejectedValue(new Error("db")),
      ],
    ])("throws an InternalServerError on %s", async (_case, arrange) => {
      arrange();

      await expect(
        createAddressAction({ ...base, building: "Hall" })
      ).rejects.toThrow(new InternalServerError("Failed to create address."));
    });
  });

  describe("updateAddressAction", () => {
    beforeEach(() => {
      db.building.findFirst.mockResolvedValue({
        id: "b1",
        name: "Hall",
        hostel_block: "A",
      });
    });

    // Regression: building_id used to be sent next to building_ref, which
    // Prisma rejects (relation input mixed with its raw foreign key).
    it("updates the user's address with only the building relation", async () => {
      repo.updateWithDefault.mockResolvedValue(address as never);

      const res = await updateAddressAction({
        id: "addr-1",
        data: { ...base, building_id: "b1" },
      });

      expect(repo.updateWithDefault).toHaveBeenCalledWith("addr-1", "user-1", {
        ...base,
        building: "Hall",
        hostel_block: "A",
        building_ref: { connect: { id: "b1" } },
      });
      expect(res.details).toBe("Address updated successfully!");
    });

    it("rejects an address that is not the user's", async () => {
      repo.updateWithDefault.mockResolvedValue(null);

      await expect(
        updateAddressAction({
          id: "addr-1",
          data: { ...base, building_id: "b1" },
        })
      ).rejects.toThrow(
        new ForbiddenError("Address not found or does not belong to you.")
      );
    });

    it("wraps a missing user", async () => {
      auth.getUserId.mockResolvedValue("");

      await expect(
        updateAddressAction({ id: "addr-1", data: base })
      ).rejects.toThrow(new InternalServerError("Failed to update address."));
    });
  });

  describe("deleteAddressAction", () => {
    it("deletes the user's address", async () => {
      repo.deleteByIdAndUserId.mockResolvedValue(address as never);

      const res = await deleteAddressAction("addr-1");

      expect(repo.deleteByIdAndUserId).toHaveBeenCalledWith("addr-1", "user-1");
      expect(res).toMatchObject({ data: null });
    });

    it("rejects an address that is not the user's", async () => {
      repo.deleteByIdAndUserId.mockResolvedValue(null);

      await expect(deleteAddressAction("addr-1")).rejects.toBeInstanceOf(
        ForbiddenError
      );
    });

    it("wraps unexpected errors", async () => {
      repo.deleteByIdAndUserId.mockRejectedValue(new Error("db"));

      await expect(deleteAddressAction("addr-1")).rejects.toThrow(
        new InternalServerError("Failed to delete address.")
      );
    });
  });

  describe("setDefaultAddressAction", () => {
    it("sets the user's default address", async () => {
      repo.setDefault.mockResolvedValue(address as never);

      const res = await setDefaultAddressAction("addr-1");

      expect(repo.setDefault).toHaveBeenCalledWith("user-1", "addr-1");
      expect(res).toMatchObject({
        data: address,
        details: "Default address updated successfully!",
      });
    });

    it("rejects an address that is not the user's", async () => {
      repo.setDefault.mockResolvedValue(null);

      await expect(setDefaultAddressAction("addr-1")).rejects.toBeInstanceOf(
        ForbiddenError
      );
    });

    it("wraps a missing user", async () => {
      auth.getUserId.mockResolvedValue("");

      await expect(setDefaultAddressAction("addr-1")).rejects.toThrow(
        new InternalServerError("Failed to set default address.")
      );
    });
  });
});
