import React from "react";

import { useUpdateShop } from "@/hooks/useShopForm";
import { shopUIServices } from "@/lib/utils-functions";
import { ImageUtils } from "@/lib/utils-functions/image.utils";
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
  const formFields = shopUIServices
    .createShopUpdateFormFields()
    .map((field) => {
      if (field.name === "image" && shop.imageKey) {
        return {
          ...field,
          previewUrl: ImageUtils.getImageUrl(shop.imageKey),
        };
      }
      return field;
    });

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
