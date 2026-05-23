"use server";

import {
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { userAddressRepository } from "@/repositories";
import { createSuccessResponse } from "@/types/response.types";

export async function getUserAddressesAction() {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const addresses = await userAddressRepository.findByUserId(user_id);
    return createSuccessResponse(addresses, "Addresses fetched successfully!");
  } catch (error) {
    console.error("GET USER ADDRESSES ERROR:", error);
    throw new InternalServerError("Failed to fetch addresses.");
  }
}

export type CreateAddressFormData = {
  label: string;
  building_id?: string;
  hostel_block?: string;
  building?: string;
  room_number: string;
  notes?: string;
  is_default: boolean;
};

async function normalizeAddressData(data: CreateAddressFormData) {
  if (data.building_id) {
    const building = await prisma.building.findFirst({
      where: { id: data.building_id, is_active: true },
    });
    if (!building) {
      throw new ForbiddenError("Selected building is not available.");
    }

    return {
      ...data,
      building_ref: { connect: { id: building.id } },
      building: building.name,
      hostel_block: building.hostel_block ?? undefined,
    };
  }

  if (!data.building?.trim()) {
    throw new ForbiddenError("Building is required.");
  }

  const name = data.building.trim();
  const hostelBlock = data.hostel_block?.trim() || null;
  const existing = await prisma.building.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      hostel_block: hostelBlock,
    },
  });
  const building =
    existing ??
    (await prisma.building.create({
      data: {
        name,
        hostel_block: hostelBlock,
      },
    }));

  return {
    ...data,
    building_ref: { connect: { id: building.id } },
    building: name,
    hostel_block: hostelBlock ?? undefined,
  };
}

export async function createAddressAction(data: CreateAddressFormData) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const { building_id, ...normalized } = await normalizeAddressData(data);
    const addressData = {
      ...normalized,
      building_ref: { connect: { id: building_id } },
      user: { connect: { id: user_id } },
    };

    const address = await userAddressRepository.createWithDefault(
      addressData,
      user_id
    );
    return createSuccessResponse(address, "Address created successfully!");
  } catch (error) {
    console.error("CREATE ADDRESS ERROR:", error);
    throw new InternalServerError("Failed to create address.");
  }
}

export async function updateAddressAction({
  id,
  data,
}: {
  id: string;
  data: CreateAddressFormData;
}) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("User not authorized");
    }

    const normalized = await normalizeAddressData(data);
    const address = await userAddressRepository.updateWithDefault(
      id,
      user_id,
      normalized
    );

    if (!address) {
      throw new ForbiddenError("Address not found or does not belong to you.");
    }

    return createSuccessResponse(address, "Address updated successfully!");
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw error;
    }
    console.error("UPDATE ADDRESS ERROR:", error);
    throw new InternalServerError("Failed to update address.");
  }
}

export async function deleteAddressAction(id: string) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("User not authorized");
    }

    const deletedAddress = await userAddressRepository.deleteByIdAndUserId(
      id,
      user_id
    );

    if (!deletedAddress) {
      throw new ForbiddenError("Address not found or does not belong to you.");
    }

    return createSuccessResponse(null, "Address deleted successfully!");
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw error;
    }
    console.error("DELETE ADDRESS ERROR:", error);
    throw new InternalServerError("Failed to delete address.");
  }
}

export async function setDefaultAddressAction(id: string) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("User not authorized");
    }

    const address = await userAddressRepository.setDefault(user_id, id);
    return createSuccessResponse(
      address,
      "Default address updated successfully!"
    );
  } catch (error) {
    console.error("SET DEFAULT ADDRESS ERROR:", error);
    throw new InternalServerError("Failed to set default address.");
  }
}
