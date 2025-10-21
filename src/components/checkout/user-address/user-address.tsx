"use client";

import { UserAddress as UserAddressType } from "@prisma/client";
import React from "react";

import {
  UserAddressFormContainer,
  UserAddressList,
} from "@/components/checkout/user-address";
import { useUserAddressManager } from "@/hooks";

interface UserAddressProps {
  selectedAddressId?: string | null;
  onAddressSelect?: (address: UserAddressType) => void;
}

export function UserAddress({
  selectedAddressId,
  onAddressSelect,
}: UserAddressProps) {
  const { showForm, handleShowForm, handleHideForm } = useUserAddressManager();

  if (showForm) {
    return (
      <UserAddressFormContainer
        onSuccess={handleHideForm}
        onCancel={handleHideForm}
      />
    );
  }

  return (
    <UserAddressList
      selectedAddressId={selectedAddressId}
      onAddressSelect={onAddressSelect}
      onAddNewAddress={handleShowForm}
    />
  );
}
