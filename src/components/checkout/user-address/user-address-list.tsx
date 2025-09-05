"use client";

import { UserAddress } from "@prisma/client";
import React from "react";

import { SelectedAddressDisplay } from "./selected-address-display";
import { UserAddressCard } from "./user-address-card";
import { UserAddressListEmpty } from "./user-address-list-empty";
import { UserAddressListError } from "./user-address-list-error";
import { UserAddressListHeader } from "./user-address-list-header";
import { UserAddressListSkeleton } from "./user-address-list-skeleton";

interface UserAddressListProps {
  addresses: UserAddress[] | undefined;
  isLoading: boolean;
  error: boolean;
  selectedAddressId: string | null;
  onAddressSelect: (address: UserAddress) => void;
  onAddNewAddress: () => void;
  onSetDefault: (addressId: string) => void;
  onDelete: (address: UserAddress) => void;
  isSetDefaultPending: boolean;
  isDeletePending: boolean;
}

export function UserAddressList({
  addresses,
  isLoading,
  error,
  selectedAddressId,
  onAddressSelect,
  onAddNewAddress,
  onSetDefault,
  onDelete,
  isSetDefaultPending,
  isDeletePending,
}: UserAddressListProps) {
  if (isLoading) {
    return <UserAddressListSkeleton onAddNewAddress={onAddNewAddress} />;
  }

  if (error) {
    return <UserAddressListError onAddNewAddress={onAddNewAddress} />;
  }

  if (!addresses || addresses.length === 0) {
    return <UserAddressListEmpty onAddNewAddress={onAddNewAddress} />;
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="space-y-4">
      <UserAddressListHeader onAddNewAddress={onAddNewAddress} />

      <div className="space-y-3">
        {addresses.map((address) => (
          <UserAddressCard
            key={address.id}
            address={address}
            isSelected={selectedAddressId === address.id}
            onSelect={onAddressSelect}
            onSetDefault={onSetDefault}
            onDelete={onDelete}
            isSetDefaultPending={isSetDefaultPending}
            isDeletePending={isDeletePending}
          />
        ))}
      </div>

      {selectedAddress && (
        <SelectedAddressDisplay selectedAddress={selectedAddress} />
      )}
    </div>
  );
}
