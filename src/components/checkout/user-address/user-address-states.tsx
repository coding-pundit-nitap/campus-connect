"use client";

import { MapPin, Plus } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

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

interface UserAddressListSkeletonProps {
  onAddNewAddress: () => void;
}

export function UserAddressListSkeleton({
  onAddNewAddress,
}: UserAddressListSkeletonProps) {
  return (
    <div className="space-y-4">
      <UserAddressListHeader
        onAddNewAddress={onAddNewAddress}
        showAddButton={false}
      />
      <Skeleton className="h-10 w-32" />
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}
