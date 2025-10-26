"use server";
import z from "zod";

import { ValidationError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils";
import { userAddressRepository, userRepository } from "@/repositories";
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

  await userAddressRepository.create({
    ...validatedFields.data,
    user: {
      connect: {
        id: user_id,
      },
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

  await userAddressRepository.update(user_id, validatedFields.data);
}

export async function deleteUserAddress(id: string) {
  await authUtils.isAuthenticated();

  await userAddressRepository.delete(id);
}
