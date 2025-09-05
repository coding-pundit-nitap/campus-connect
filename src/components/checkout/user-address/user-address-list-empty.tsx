"use client";

import { MapPin, Plus } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

import { UserAddressListHeader } from "./user-address-list-header";

interface UserAddressListEmptyProps {
  onAddNewAddress: () => void;
}

export function UserAddressListEmpty({
  onAddNewAddress,
}: UserAddressListEmptyProps) {
  return (
    <div className="space-y-4">
      <UserAddressListHeader onAddNewAddress={onAddNewAddress} />
      <EmptyState
        title="No addresses saved"
        description="Add a delivery address to continue with your order."
        icon={<MapPin className="h-12 w-12" />}
        action={
          <Button onClick={onAddNewAddress}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Address
          </Button>
        }
      />
    </div>
  );
}
