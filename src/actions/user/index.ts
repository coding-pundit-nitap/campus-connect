"use server";
import z from "zod";

import { userAddressRepository, userRepository } from "@/di/container";
import { ValidationError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  updateUserSchema,
  userAddressSchema,
} from "@/validations/user.validation";

export async function updateUser(values: z.infer<typeof updateUserSchema>) {
  const user_id = await authUtils.getUserId();

  const validatedFields = updateUserSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new ValidationError("Invalid fields");
  }

  await userRepository.update(user_id, validatedFields.data);
}

export async function addUserAddress(
  values: z.infer<typeof userAddressSchema>
) {
  const user_id = await authUtils.getUserId();

  const validatedFields = userAddressSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new ValidationError("Invalid fields");
  }

  if (!validatedFields.data.building?.trim()) {
    throw new ValidationError("Building is required");
  }

  await userAddressRepository.create({
    data: {
      ...validatedFields.data,
      building: validatedFields.data.building.trim(),
      user_id,
    },
  });
}

export async function updateUserAddress(
  values: z.infer<typeof userAddressSchema>
) {
  const user_id = await authUtils.getUserId();

  const validatedFields = userAddressSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new ValidationError("Invalid fields");
  }

  if (!validatedFields.data.building?.trim()) {
    throw new ValidationError("Building is required");
  }

  await userAddressRepository.update(user_id, {
    ...validatedFields.data,
    building: validatedFields.data.building.trim(),
  });
}

export async function deleteUserAddress(id: string) {
  await authUtils.isAuthenticated();

  await userAddressRepository.delete(id);
}
