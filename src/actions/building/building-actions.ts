"use server";

import {
  requireOwnedShopId,
  requireUserId,
  runAction,
} from "@/actions/_shared/action-helpers";
import { container } from "@/di/container";
import { BadRequestError, UnauthorizedError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { createSuccessResponse } from "@/types/response.types";
const log = createLogger("building-actions");

export type BuildingInput = {
  name: string;
  hostel_block?: string | null;
};

function normalizeBuildingInput(input: BuildingInput) {
  const name = input.name.trim();
  const hostelBlock = input.hostel_block?.trim() || null;

  if (!name) {
    throw new BadRequestError("Building name is required.");
  }

  return { name, hostelBlock };
}

function toBuildingDto(building: {
  id: string;
  name: string;
  hostel_block: string | null;
}) {
  return {
    id: building.id,
    name: building.name,
    hostel_block: building.hostel_block,
  };
}

export async function createBuildingAction(input: BuildingInput) {
  return runAction(
    log,
    {
      label: "CREATE BUILDING ERROR:",
      fallback: "Failed to create building.",
      passthrough: [BadRequestError, UnauthorizedError],
    },
    async () => {
      await requireUserId("Not authorized");

      const { name, hostelBlock } = normalizeBuildingInput(input);

      const existing = await container.db.building.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          hostel_block: hostelBlock,
        },
      });

      if (existing) {
        return createSuccessResponse(
          toBuildingDto(existing),
          "Building already exists."
        );
      }

      const building = await container.db.building.create({
        data: {
          name,
          hostel_block: hostelBlock,
        },
      });

      return createSuccessResponse(
        toBuildingDto(building),
        "Building created successfully."
      );
    }
  );
}

export async function addShopDeliveryBuildingAction(buildingId: string) {
  return runAction(
    log,
    {
      label: "ADD SHOP DELIVERY BUILDING ERROR:",
      fallback: "Failed to add delivery building.",
      passthrough: [BadRequestError, UnauthorizedError],
    },
    async () => {
      const shopId = await requireOwnedShopId();

      const building = await container.db.building.findUnique({
        where: { id: buildingId },
        select: { id: true, is_active: true },
      });

      if (!building || !building.is_active) {
        throw new BadRequestError("Building not found.");
      }

      await container.db.shopDeliveryBuilding.upsert({
        where: {
          shop_id_building_id: {
            shop_id: shopId,
            building_id: buildingId,
          },
        },
        update: { is_active: true },
        create: {
          shop_id: shopId,
          building_id: buildingId,
          is_active: true,
        },
      });

      return createSuccessResponse(null, "Delivery building added.");
    }
  );
}

export async function removeShopDeliveryBuildingAction(buildingId: string) {
  return runAction(
    log,
    {
      label: "REMOVE SHOP DELIVERY BUILDING ERROR:",
      fallback: "Failed to remove delivery building.",
      passthrough: [UnauthorizedError],
    },
    async () => {
      const shopId = await requireOwnedShopId();

      await container.db.shopDeliveryBuilding.updateMany({
        where: {
          shop_id: shopId,
          building_id: buildingId,
        },
        data: { is_active: false },
      });

      return createSuccessResponse(null, "Delivery building removed.");
    }
  );
}
