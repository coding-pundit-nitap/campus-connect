import { type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { container } from "@/di/container";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import {
  addShopDeliveryBuildingAction,
  createBuildingAction,
  removeShopDeliveryBuildingAction,
} from "./building-actions";

vi.mock("@/di/container", async () => {
  const h = await import("@tests/helpers");
  return h.mockModule({ container: { db: h.createPrismaMock() } });
});
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

const auth = vi.mocked(authUtils);
const db = container.db as unknown as PrismaMock;
const building = { id: "b1", name: "Hall", hostel_block: "A", extra: 1 };

describe("building-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
    auth.getOwnedShopId.mockResolvedValue("shop-1");
  });

  describe("createBuildingAction", () => {
    it("creates a building from the trimmed input", async () => {
      db.building.findFirst.mockResolvedValue(null);
      db.building.create.mockResolvedValue(building);

      const res = await createBuildingAction({
        name: "  Hall ",
        hostel_block: " A ",
      });

      expect(db.building.findFirst).toHaveBeenCalledWith({
        where: {
          name: { equals: "Hall", mode: "insensitive" },
          hostel_block: "A",
        },
      });
      expect(db.building.create).toHaveBeenCalledWith({
        data: { name: "Hall", hostel_block: "A" },
      });
      expect(res).toMatchObject({
        data: { id: "b1", name: "Hall", hostel_block: "A" },
        details: "Building created successfully.",
      });
    });

    it("returns an existing building instead of creating a duplicate", async () => {
      db.building.findFirst.mockResolvedValue(building);

      const res = await createBuildingAction({
        name: "hall",
        hostel_block: "",
      });

      expect(db.building.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({ hostel_block: null }),
      });
      expect(db.building.create).not.toHaveBeenCalled();
      expect(res).toEqual({
        success: true,
        error: false,
        data: { id: "b1", name: "Hall", hostel_block: "A" },
        details: "Building already exists.",
      });
    });

    it("rejects a blank name", async () => {
      await expect(createBuildingAction({ name: "   " })).rejects.toThrow(
        new BadRequestError("Building name is required.")
      );
    });

    it("rejects an anonymous caller", async () => {
      auth.getUserId.mockResolvedValue("");

      await expect(createBuildingAction({ name: "Hall" })).rejects.toThrow(
        new UnauthorizedError("Not authorized")
      );
    });

    it("wraps database failures", async () => {
      db.building.findFirst.mockRejectedValue(new Error("db"));

      await expect(createBuildingAction({ name: "Hall" })).rejects.toThrow(
        new InternalServerError("Failed to create building.")
      );
    });
  });

  describe("addShopDeliveryBuildingAction", () => {
    it("activates delivery to an active building", async () => {
      db.building.findUnique.mockResolvedValue({ id: "b1", is_active: true });

      const res = await addShopDeliveryBuildingAction("b1");

      expect(db.shopDeliveryBuilding.upsert).toHaveBeenCalledWith({
        where: {
          shop_id_building_id: { shop_id: "shop-1", building_id: "b1" },
        },
        update: { is_active: true },
        create: { shop_id: "shop-1", building_id: "b1", is_active: true },
      });
      expect(res.details).toBe("Delivery building added.");
    });

    it.each([null, { id: "b1", is_active: false }])(
      "rejects an unknown or inactive building (%o)",
      async (found) => {
        db.building.findUnique.mockResolvedValue(found);

        await expect(addShopDeliveryBuildingAction("b1")).rejects.toThrow(
          new BadRequestError("Building not found.")
        );
      }
    );

    it("rejects a caller without a shop", async () => {
      auth.getOwnedShopId.mockResolvedValue("");

      await expect(addShopDeliveryBuildingAction("b1")).rejects.toBeInstanceOf(
        UnauthorizedError
      );
    });

    it("wraps database failures", async () => {
      db.building.findUnique.mockRejectedValue(new Error("db"));

      await expect(addShopDeliveryBuildingAction("b1")).rejects.toThrow(
        new InternalServerError("Failed to add delivery building.")
      );
    });
  });

  describe("removeShopDeliveryBuildingAction", () => {
    it("deactivates delivery to the building", async () => {
      const res = await removeShopDeliveryBuildingAction("b1");

      expect(db.shopDeliveryBuilding.updateMany).toHaveBeenCalledWith({
        where: { shop_id: "shop-1", building_id: "b1" },
        data: { is_active: false },
      });
      expect(res.details).toBe("Delivery building removed.");
    });

    it("rejects a caller without a shop", async () => {
      auth.getOwnedShopId.mockResolvedValue("");

      await expect(
        removeShopDeliveryBuildingAction("b1")
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("wraps database failures", async () => {
      db.shopDeliveryBuilding.updateMany.mockRejectedValue(new Error("db"));

      await expect(removeShopDeliveryBuildingAction("b1")).rejects.toThrow(
        new InternalServerError("Failed to remove delivery building.")
      );
    });
  });
});
