"use client";

import { MapPin } from "lucide-react";
import React from "react";

import { EmptyState } from "@/components/ui/empty-state";

import { UserAddressListHeader } from "./user-address-list-header";

interface UserAddressListErrorProps {
  onAddNewAddress: () => void;
}

export function UserAddressListError({
  onAddNewAddress,
}: UserAddressListErrorProps) {
  return (
    <div className="space-y-4">
      <UserAddressListHeader onAddNewAddress={onAddNewAddress} />
      <EmptyState
        title="Error loading addresses"
        description="Failed to load your saved addresses. Please try again."
        icon={<MapPin className="h-12 w-12" />}
      />
    </div>
  );
}
