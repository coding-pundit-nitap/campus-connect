import React from "react";

import { useUpdateShop } from "@/hooks/useShopForm";
import { shopUIServices } from "@/lib/utils-functions";
import { ShopWithOwner } from "@/types/shop.types";

import { ShopEditDialog } from "./shop-edit-dialog";

interface ShopEditFormContainerProps {
  shop: ShopWithOwner;
  className?: string;
}

export function ShopEditFormContainer({
  shop,
  className,
}: ShopEditFormContainerProps) {
  const { form, state, handlers, isDialogOpen, setIsDialogOpen } =
    useUpdateShop({ shop });
  const formFields = shopUIServices.createShopUpdateFormFields();

  return (
    <ShopEditDialog
      shop={shop}
      form={form}
      state={state}
      handlers={handlers}
      fields={formFields}
      className={className}
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
    />
  );
}
