"use client";

import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { UserAddressListHeader } from "./user-address-list-header";

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
