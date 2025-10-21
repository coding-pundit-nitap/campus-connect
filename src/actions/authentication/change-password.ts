"use server";

import { ChangePasswordFormValues } from "@/components/profile/security";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/custom-error";
import authUtils from "@/lib/utils-functions/auth.utils";
import { userRepository } from "@/repositories";
import { createSuccessResponse } from "@/types";
import { changePasswordSchema } from "@/validations/user.validation";

export const changePaswordAction = async (data: ChangePasswordFormValues) => {
  const user_id = await authUtils.getUserId();

  const { currentPassword, newPassword } = changePasswordSchema.parse(data);
  const user = await userRepository.findById(user_id, {
    select: {
      hash_password: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("Unauthorize to change the password.");
  }

  const isMatched = user.hash_password
    ? await verifyPassword(currentPassword, user.hash_password)
    : true;

  if (!isMatched) {
    throw new UnauthorizedError("Unauthorize to change the password.");
  }

  const hash_password = await hashPassword(newPassword);

  await userRepository.update(user_id, {
    hash_password,
  });

  return createSuccessResponse(null, "Password Changed Successfully.");
};
