import { UserAddress } from "@/../prisma/generated/client";

class UserAddressUIService {
  canDeleteAddress = (
    address: UserAddress,
    allAddresses: UserAddress[]
  ): boolean => {
    if (allAddresses.length === 1) {
      return false;
    }

    return true;
  };

  getDeleteConfirmationMessage = (address: UserAddress): string => {
    if (address.is_default) {
      return `Are you sure you want to delete your default address "${address.label}"? Another address will be set as default.`;
    }
    return `Are you sure you want to delete the address "${address.label}"?`;
  };
}

export const userAddressUIService = new UserAddressUIService();

export default userAddressUIService;
