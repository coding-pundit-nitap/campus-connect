"use server";

import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";
import { createSuccessResponse } from "@/types/response.types";

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

export async function createBuildingAction(input: BuildingInput) {
  try {
    const userId = await authUtils.getUserId();
    if (!userId) throw new UnauthorizedError("Not authorized");

    const { name, hostelBlock } = normalizeBuildingInput(input);

    const existing = await prisma.building.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        hostel_block: hostelBlock,
      },
    });

    if (existing) {
      return createSuccessResponse(
        {
          id: existing.id,
          name: existing.name,
          hostel_block: existing.hostel_block,
        },
        "Building already exists."
      );
    }

    const building = await prisma.building.create({
      data: {
        name,
        hostel_block: hostelBlock,
      },
    });

    return createSuccessResponse(
      {
        id: building.id,
        name: building.name,
        hostel_block: building.hostel_block,
      },
      "Building created successfully."
    );
  } catch (error) {
    console.error("CREATE BUILDING ERROR:", error);
    if (
      error instanceof BadRequestError ||
      error instanceof UnauthorizedError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to create building.");
  }
}

export async function addShopDeliveryBuildingAction(buildingId: string) {
  try {
    const shopId = await authUtils.getOwnedShopId();
    if (!shopId) {
      throw new UnauthorizedError("Unauthorized: You do not own a shop.");
    }

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: { id: true, is_active: true },
    });

    if (!building || !building.is_active) {
      throw new BadRequestError("Building not found.");
    }

    await prisma.shopDeliveryBuilding.upsert({
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
  } catch (error) {
    console.error("ADD SHOP DELIVERY BUILDING ERROR:", error);
    if (
      error instanceof BadRequestError ||
      error instanceof UnauthorizedError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to add delivery building.");
  }
}

export async function removeShopDeliveryBuildingAction(buildingId: string) {
  try {
    const shopId = await authUtils.getOwnedShopId();
    if (!shopId) {
      throw new UnauthorizedError("Unauthorized: You do not own a shop.");
    }

    await prisma.shopDeliveryBuilding.updateMany({
      where: {
        shop_id: shopId,
        building_id: buildingId,
      },
      data: { is_active: false },
    });

    return createSuccessResponse(null, "Delivery building removed.");
  } catch (error) {
    console.error("REMOVE SHOP DELIVERY BUILDING ERROR:", error);
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new InternalServerError("Failed to remove delivery building.");
  }
}
