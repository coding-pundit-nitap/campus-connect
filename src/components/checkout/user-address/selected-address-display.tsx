"use client";

import React from "react";

import { UserAddress } from "@/types/prisma.types";

interface SelectedAddressDisplayProps {
  selectedAddress: UserAddress;
}

export function SelectedAddressDisplay({
  selectedAddress,
}: SelectedAddressDisplayProps) {
  const formatAddressWithLabel = (address: UserAddress) =>
    `${address.label} - ${address.building}, Room ${address.room_number}`;

  return (
    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
      <p className="font-medium mb-1">Selected delivery address:</p>
      <p>{formatAddressWithLabel(selectedAddress)}</p>
    </div>
  );
}
