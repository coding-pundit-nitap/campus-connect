import { type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError, ValidationError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import {
  createBatchSlotAction,
  deleteBatchSlotAction,
  listBatchSlotsAction,
  reorderBatchSlotsAction,
  updateBatchSlotAction,
} from "./batch-slot-actions";

vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("@tests/helpers")).createPrismaMock(),
}));

const auth = vi.mocked(authUtils);
const db = prisma as unknown as PrismaMock;
const slot = {
  id: "s1",
  cutoff_time_minutes: 600,
  label: "Lunch",
  is_active: true,
  sort_order: 0,
};
const MIGRATION =
  "Batch Cards are not available yet (database migration pending).";
const GENERIC = "Failed to manage batch cards.";

describe("batch-slot-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getOwnedShopId.mockResolvedValue("shop-1");
    db.batchSlot.findUnique.mockResolvedValue({ id: "s1", shop_id: "shop-1" });
  });

  describe("listBatchSlotsAction", () => {
    it("lists the shop's slots in display order", async () => {
      db.batchSlot.findMany.mockResolvedValue([slot]);

      const res = await listBatchSlotsAction();

      expect(db.batchSlot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shop_id: "shop-1" },
          orderBy: [{ sort_order: "asc" }, { cutoff_time_minutes: "asc" }],
        })
      );
      expect(res.data).toEqual([slot]);
    });

    it.each([
      [new Error('relation "batch_slot" missing'), MIGRATION],
      [new Error("model BatchSlot unknown"), MIGRATION],
      [new Error("Table DOES NOT EXIST"), MIGRATION],
      [new Error("timeout"), GENERIC],
      ["not an error", GENERIC],
    ])(
      "maps database error %j to a friendly message",
      async (error, message) => {
        db.batchSlot.findMany.mockRejectedValue(error);

        await expect(listBatchSlotsAction()).rejects.toThrow(
          new ValidationError(message)
        );
      }
    );
  });

  describe("createBatchSlotAction", () => {
    it("appends a slot after the current last one", async () => {
      db.batchSlot.aggregate.mockResolvedValue({ _max: { sort_order: 2 } });
      db.batchSlot.create.mockResolvedValue(slot);

      const res = await createBatchSlotAction({
        cutoff_time_minutes: 600,
        label: "  Lunch ",
      });

      expect(db.batchSlot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            shop_id: "shop-1",
            cutoff_time_minutes: 600,
            label: "Lunch",
            is_active: true,
            sort_order: 3,
          },
        })
      );
      expect(res).toMatchObject({ data: slot, details: "Batch card created" });
    });

    it("starts at 0 with a null label for the first slot", async () => {
      db.batchSlot.aggregate.mockResolvedValue({ _max: { sort_order: null } });

      await createBatchSlotAction({ cutoff_time_minutes: 0, label: " " });

      expect(db.batchSlot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ label: null, sort_order: 0 }),
        })
      );
    });

    it.each([-1, 1440, 10.5])("rejects the cutoff %s", async (minutes) => {
      await expect(
        createBatchSlotAction({ cutoff_time_minutes: minutes })
      ).rejects.toThrow(
        new ValidationError("Invalid cutoff time. Must be 0-1439 minutes.")
      );
      expect(db.batchSlot.aggregate).not.toHaveBeenCalled();
    });

    it("maps database errors", async () => {
      db.batchSlot.aggregate.mockRejectedValue(new Error("boom"));

      await expect(
        createBatchSlotAction({ cutoff_time_minutes: 600 })
      ).rejects.toThrow(GENERIC);
    });
  });

  describe("updateBatchSlotAction", () => {
    it("updates the slot, including its active flag", async () => {
      db.batchSlot.update.mockResolvedValue(slot);

      const res = await updateBatchSlotAction({
        id: "s1",
        cutoff_time_minutes: 700,
        label: "Late",
        is_active: false,
      });

      expect(db.batchSlot.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "s1" },
          data: { cutoff_time_minutes: 700, label: "Late", is_active: false },
        })
      );
      expect(res.details).toBe("Batch card updated");
    });

    it("leaves the active flag alone when it is not given", async () => {
      await updateBatchSlotAction({ id: "s1", cutoff_time_minutes: 700 });

      expect(db.batchSlot.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { cutoff_time_minutes: 700, label: null },
        })
      );
    });

    // Regression: the ownership error used to be swallowed by the catch and
    // replaced with the generic "Failed to manage batch cards." message.
    it.each([[null], [{ id: "s1", shop_id: "other" }]])(
      "reports a missing or foreign slot %o as such",
      async (found) => {
        db.batchSlot.findUnique.mockResolvedValue(found);

        await expect(
          updateBatchSlotAction({ id: "s1", cutoff_time_minutes: 700 })
        ).rejects.toThrow(
          new ValidationError("Batch card not found or unauthorized")
        );
        expect(db.batchSlot.update).not.toHaveBeenCalled();
      }
    );

    it("rejects an invalid cutoff", async () => {
      await expect(
        updateBatchSlotAction({ id: "s1", cutoff_time_minutes: 5000 })
      ).rejects.toThrow("Invalid cutoff time");
    });
  });

  describe("deleteBatchSlotAction", () => {
    it("deletes the shop's slot", async () => {
      const res = await deleteBatchSlotAction("s1");

      expect(db.batchSlot.delete).toHaveBeenCalledWith({ where: { id: "s1" } });
      expect(res.details).toBe("Batch card deleted");
    });

    it("reports a foreign slot as not found", async () => {
      db.batchSlot.findUnique.mockResolvedValue({ id: "s1", shop_id: "x" });

      await expect(deleteBatchSlotAction("s1")).rejects.toThrow(
        "Batch card not found or unauthorized"
      );
      expect(db.batchSlot.delete).not.toHaveBeenCalled();
    });

    it("maps database errors", async () => {
      db.batchSlot.delete.mockRejectedValue(new Error("BatchSlot gone"));

      await expect(deleteBatchSlotAction("s1")).rejects.toThrow(MIGRATION);
    });
  });

  describe("reorderBatchSlotsAction", () => {
    beforeEach(() => {
      db.batchSlot.findMany.mockResolvedValue([{ id: "s1" }, { id: "s2" }]);
    });

    it("stores the new order in one transaction", async () => {
      const res = await reorderBatchSlotsAction({ ordered_ids: ["s2", "s1"] });

      expect(db.batchSlot.update).toHaveBeenNthCalledWith(1, {
        where: { id: "s2" },
        data: { sort_order: 0 },
      });
      expect(db.batchSlot.update).toHaveBeenNthCalledWith(2, {
        where: { id: "s1" },
        data: { sort_order: 1 },
      });
      expect(db.$transaction).toHaveBeenCalledTimes(1);
      expect(res.details).toBe("Batch cards reordered");
    });

    it.each([[[]], [null]])("rejects the payload %j", async (ids) => {
      await expect(
        reorderBatchSlotsAction({ ordered_ids: ids as never })
      ).rejects.toThrow(new ValidationError("Invalid ordering payload."));
    });

    it("reports ids that are not the shop's", async () => {
      await expect(
        reorderBatchSlotsAction({ ordered_ids: ["s1", "zz"] })
      ).rejects.toThrow(
        new ValidationError("One or more batch cards are invalid.")
      );
      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });

  it.each([
    ["listBatchSlotsAction", () => listBatchSlotsAction()],
    [
      "createBatchSlotAction",
      () => createBatchSlotAction({ cutoff_time_minutes: 1 }),
    ],
    [
      "updateBatchSlotAction",
      () => updateBatchSlotAction({ id: "s1", cutoff_time_minutes: 1 }),
    ],
    ["deleteBatchSlotAction", () => deleteBatchSlotAction("s1")],
    [
      "reorderBatchSlotsAction",
      () => reorderBatchSlotsAction({ ordered_ids: ["s1"] }),
    ],
  ])("%s requires a shop owner", async (_n, act) => {
    auth.getOwnedShopId.mockResolvedValue("");

    await expect(act()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
