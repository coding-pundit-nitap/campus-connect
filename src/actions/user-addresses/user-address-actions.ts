"use server";

import { InternalServerError, UnauthorizedError } from "@/lib/custom-error";
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
  building: string;
  room_number: string;
  notes?: string;
  is_default: boolean;
};

export async function createAddressAction(data: CreateAddressFormData) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }
    if (data.is_default) {
      const existingAddresses =
        await userAddressRepository.findByUserId(user_id);
      for (const address of existingAddresses) {
        if (address.is_default) {
          await userAddressRepository.update(address.id, { is_default: false });
        }
      }
    }

    const addressData = {
      ...data,
      user: { connect: { id: user_id } },
    };

    const address = await userAddressRepository.create(addressData);
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
    if (data.is_default) {
      const existingAddresses =
        await userAddressRepository.findByUserId(user_id);
      for (const address of existingAddresses) {
        if (address.is_default && address.id !== id) {
          await userAddressRepository.update(address.id, { is_default: false });
        }
      }
    }

    const address = await userAddressRepository.update(id, data);
    return createSuccessResponse(address, "Address updated successfully!");
  } catch (error) {
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

    await userAddressRepository.delete(id);
    return createSuccessResponse(null, "Address deleted successfully!");
  } catch (error) {
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

    const existingAddresses = await userAddressRepository.findByUserId(user_id);
    for (const address of existingAddresses) {
      if (address.is_default) {
        await userAddressRepository.update(address.id, { is_default: false });
      }
    }

    const address = await userAddressRepository.update(id, {
      is_default: true,
    });
    return createSuccessResponse(
      address,
      "Default address updated successfully!"
    );
  } catch (error) {
    console.error("SET DEFAULT ADDRESS ERROR:", error);
    throw new InternalServerError("Failed to set default address.");
  }
}
