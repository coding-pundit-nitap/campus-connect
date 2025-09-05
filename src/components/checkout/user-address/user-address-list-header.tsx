"use client";

import { Plus } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

interface UserAddressListHeaderProps {
  onAddNewAddress: () => void;
  showAddButton?: boolean;
  variant?: "default" | "outline";
}

export function UserAddressListHeader({
  onAddNewAddress,
  showAddButton = true,
  variant = "outline",
}: UserAddressListHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Delivery Address</h3>
      {showAddButton && (
        <Button onClick={onAddNewAddress} variant={variant} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      )}
    </div>
  );
}
