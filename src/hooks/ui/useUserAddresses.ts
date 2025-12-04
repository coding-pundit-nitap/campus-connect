"use client";
import { useState } from "react";
import { toast } from "sonner";

import { userAddressUIService } from "@/lib/utils";
import { UserAddress } from "@/types/prisma.types";

import {
  useDeleteAddress,
  useSetDefaultAddress,
  useUserAddresses,
} from "../queries/useAddress";

export function useUserAddressManager() {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);

  const { data: addresses, isLoading, error } = useUserAddresses();
  const setDefaultMutation = useSetDefaultAddress();
  const { mutateAsync: deleteMutation, isPending } = useDeleteAddress();

  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddressId(address.id);
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultMutation.mutateAsync(addressId);
    } catch {}
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
        await deleteMutation(address.id);
        if (selectedAddressId === address.id) {
          setSelectedAddressId(null);
        }
      } catch {}
    }
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleHideForm = () => {
    setShowForm(false);
  };
  const getSelectedAddress = (): UserAddress | null => {
    if (!addresses?.data || !selectedAddressId) {
      return null;
    }
    return (
      addresses.data.find((address) => address.id === selectedAddressId) || null
    );
  };

  return {
    addresses: addresses?.data,
    isLoading,
    isPending,
    error,
    selectedAddressId,
    selectedAddress: getSelectedAddress(),
    showForm,

    setDefaultMutation,

    handleAddressSelect,
    handleSetDefault,
    handleDelete,
    handleShowForm,
    handleHideForm,
  };
}
