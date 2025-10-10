"use client";

import React from "react";

import AddressCard from "@/components/profile/address-card";
import ProfileCard from "@/components/profile/profile-card";
import ProfileHeader from "@/components/profile/profile-header";
import { SharedCard } from "@/components/shared/shared-card";

export default function CheckoutPageComponent() {
  return (
    <SharedCard
      headerContent={<ProfileHeader />}
      contentClassName="grid lg:grid-cols-2 gap-8"
    >
      <ProfileCard />
      <AddressCard />
    </SharedCard>
  );
}
