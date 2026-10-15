"use server";

import { requireUserId, runAction } from "@/actions/_shared/action-helpers";
import { userAddressRepository } from "@/di/container";
import { ForbiddenError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse } from "@/types/response.types";
const log = createLogger("user-address-actions");

export type CreateAddressFormData = {
  label: string;
  building_id?: string;
  hostel_block?: string;
  building?: string;
  room_number: string;
  notes?: string;
  is_default: boolean;
};

/**
 * Resolves the address' building (selected by id, or found/created by name)
 * into a `building_ref` relation. `building_id` is dropped from the result:
 * Prisma rejects a relation input mixed with its raw foreign key.
 * Only the form's own fields are kept: the payload is client-controlled, so
 * anything else (`user`, `user_id`, `id`, ...) must never reach Prisma.
 */
async function normalizeAddressData(form: CreateAddressFormData) {
  const { building_id } = form;
  const data = {
    label: form.label,
    hostel_block: form.hostel_block,
    building: form.building,
    room_number: form.room_number,
    notes: form.notes,
    is_default: form.is_default,
  };
  if (building_id) {
    const building = await prisma.building.findFirst({
      where: { id: building_id, is_active: true },
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

function assertOwnedAddress<T>(address: T | null | undefined): T {
  if (!address) {
    throw new ForbiddenError("Address not found or does not belong to you.");
  }
  return address;
}

export async function createAddressAction(data: CreateAddressFormData) {
  return runAction(
    log,
    {
      label: "CREATE ADDRESS ERROR:",
      fallback: "Failed to create address.",
      passthrough: [ForbiddenError],
    },
    async () => {
      const user_id = await requireUserId();

      const addressData = {
        ...(await normalizeAddressData(data)),
        user: { connect: { id: user_id } },
      };

      const address = await userAddressRepository.createWithDefault(
        addressData,
        user_id
      );
      return createSuccessResponse(address, "Address created successfully!");
    }
  );
}

export async function updateAddressAction({
  id,
  data,
}: {
  id: string;
  data: CreateAddressFormData;
}) {
  return runAction(
    log,
    {
      label: "UPDATE ADDRESS ERROR:",
      fallback: "Failed to update address.",
      passthrough: [ForbiddenError],
    },
    async () => {
      const user_id = await requireUserId("User not authorized");

      const normalized = await normalizeAddressData(data);
      const address = assertOwnedAddress(
        await userAddressRepository.updateWithDefault(id, user_id, normalized)
      );

      return createSuccessResponse(address, "Address updated successfully!");
    }
  );
}

export async function deleteAddressAction(id: string) {
  return runAction(
    log,
    {
      label: "DELETE ADDRESS ERROR:",
      fallback: "Failed to delete address.",
      passthrough: [ForbiddenError],
    },
    async () => {
      const user_id = await requireUserId("User not authorized");

      assertOwnedAddress(
        await userAddressRepository.deleteByIdAndUserId(id, user_id)
      );

      return createSuccessResponse(null, "Address deleted successfully!");
    }
  );
}

export async function setDefaultAddressAction(id: string) {
  return runAction(
    log,
    {
      label: "SET DEFAULT ADDRESS ERROR:",
      fallback: "Failed to set default address.",
      passthrough: [ForbiddenError],
    },
    async () => {
      const user_id = await requireUserId("User not authorized");

      const address = assertOwnedAddress(
        await userAddressRepository.setDefault(user_id, id)
      );

      return createSuccessResponse(
        address,
        "Default address updated successfully!"
      );
    }
  );
}
