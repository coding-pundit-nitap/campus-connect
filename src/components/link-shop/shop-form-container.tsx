import React from "react";

import { SharedCard } from "../shared/shared-card";
import { Separator } from "../ui/separator";
import ShopForm from "./shop-form";

export default function ShopFormContainer() {
  return (
    <SharedCard
      title="Link Your Shop"
      description="Connect your shop to start selling"
    >
      <Separator />
      <ShopForm />
    </SharedCard>
  );
}
