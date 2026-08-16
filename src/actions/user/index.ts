"use server";
import z from "zod";

import { userAddressRepository, userRepository } from "@/di/container";
import { ForbiddenError, ValidationError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  updateUserAddressSchema,
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

// Both functions below are duplicates of `updateAddressAction` /
// `deleteAddressAction` in
// `@/actions/user-addresses/user-address-actions.ts` (the ones actually
// wired to the UI, via `useAddress.ts`) — nothing in the app imports these.
// They are still registered as callable server actions purely because this
// file has a top-level "use server" directive (confirmed in the build
// manifest), so they are fixed here rather than left as an exploitable
// duplicate surface.
export async function updateUserAddress(
  values: z.infer<typeof updateUserAddressSchema>
) {
  const user_id = await authUtils.getUserId();

  const validatedFields = updateUserAddressSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new ValidationError("Invalid fields");
  }

  const trimmedBuilding = validatedFields.data.building?.trim();
  if (!trimmedBuilding) {
    throw new ValidationError("Building is required");
  }

  const { id, ...rest } = validatedFields.data;

  // I1: `userAddressRepository.update`'s first parameter is the ADDRESS id,
  // not the user id — passing `user_id` there (the previous bug) resolves
  // to `where: { id: user_id }`, which always throws P2025 since a
  // UserAddress row's id is never equal to a user's id. Same shape as the
  // CartService.upsertCartItem cart-id/user-id defect this branch already
  // fixed elsewhere. `updateWithDefault` takes the address id and user id
  // as separate, correctly-ordered parameters and checks ownership before
  // writing, so this is both the id-order fix and the ownership fix in one
  // call — matching updateAddressAction's use of the same repository
  // method.
  const address = await userAddressRepository.updateWithDefault(id, user_id, {
    ...rest,
    building: trimmedBuilding,
  });

  if (!address) {
    throw new ForbiddenError("Address not found or does not belong to you.");
  }
}

export async function deleteUserAddress(id: string) {
  // isAuthenticated() now returns false instead of throwing when there is
  // no session — check the result explicitly rather than relying on a
  // throw for control flow (see auth.utils.server.ts).
  if (!(await authUtils.isAuthenticated())) {
    authUtils.unAuthenticated();
  }

  const user_id = await authUtils.getUserId();

  // C3: this used to call `userAddressRepository.delete(id)` directly with
  // a caller-supplied id and no ownership check at all — any authenticated
  // user could delete any other user's address. `deleteByIdAndUserId`
  // checks `address.user_id === user_id` before deleting and returns null
  // otherwise, matching `deleteAddressAction`'s existing pattern.
  const deleted = await userAddressRepository.deleteByIdAndUserId(
    id,
    user_id
  );

  if (!deleted) {
    throw new ForbiddenError("Address not found or does not belong to you.");
  }
}
