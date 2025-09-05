"use client";

import { UserAddress } from "@prisma/client";
import React from "react";

import { useUserAddressManager } from "@/hooks";

import { UserAddressList } from "./user-address-list";

interface UserAddressListContainerProps {
  selectedAddressId: string | null;
  onAddressSelect: (address: UserAddress) => void;
  onAddNewAddress: () => void;
}

export function UserAddressListContainer({
  selectedAddressId,
  onAddressSelect,
  onAddNewAddress,
}: UserAddressListContainerProps) {
  const {
    addresses,
    isLoading,
    error,
    handleSetDefault,
    handleDelete,
    setDefaultMutation,
    deleteMutation,
  } = useUserAddressManager();

  return (
    <UserAddressList
      addresses={addresses}
      isLoading={isLoading}
      error={!!error}
      selectedAddressId={selectedAddressId}
      onAddressSelect={onAddressSelect}
      onAddNewAddress={onAddNewAddress}
      onSetDefault={handleSetDefault}
      onDelete={handleDelete}
      isSetDefaultPending={setDefaultMutation.isPending}
      isDeletePending={deleteMutation.isPending}
    />
  );
}
