import { UserAddress } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";

import { userAddressUIService } from "@/lib/utils-functions";

import {
  useDeleteAddress,
  useSetDefaultAddress,
  useUserAddresses,
} from "./tanstack/useAddress";

export function useUserAddressManager() {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);

  const { data: addresses, isLoading, error } = useUserAddresses();
  const setDefaultMutation = useSetDefaultAddress();
  const deleteMutation = useDeleteAddress();

  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddressId(address.id);
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultMutation.mutateAsync(addressId);
    } catch (error) {
      console.error("Error setting default address:", error);
    }
  };

  const handleDelete = async (address: UserAddress) => {
    if (
      !addresses?.data ||
      !userAddressUIService.canDeleteAddress(address, addresses.data)
    ) {
      toast.error("Cannot delete the only address");
      return;
    }

    const confirmMessage =
      userAddressUIService.getDeleteConfirmationMessage(address);
    if (confirm(confirmMessage)) {
      try {
        await deleteMutation.mutateAsync(address.id);
        if (selectedAddressId === address.id) {
          setSelectedAddressId(null);
        }
      } catch (error) {
        console.error("Error deleting address:", error);
      }
    }
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleHideForm = () => {
    setShowForm(false);
  };
  const getSelectedAddress = (): UserAddress | null => {
    if (!addresses?.data || !selectedAddressId) return null;
    return (
      addresses.data.find((address) => address.id === selectedAddressId) || null
    );
  };

  return {
    // Data
    addresses: addresses?.data,
    isLoading,
    error,
    selectedAddressId,
    selectedAddress: getSelectedAddress(),
    showForm,

    // Mutations
    setDefaultMutation,
    deleteMutation,

    // Handlers
    handleAddressSelect,
    handleSetDefault,
    handleDelete,
    handleShowForm,
    handleHideForm,
  };
}
