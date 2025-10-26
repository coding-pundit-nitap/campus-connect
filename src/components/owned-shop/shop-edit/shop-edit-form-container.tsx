import React from "react";

import { useUpdateShop } from "@/hooks";
import { shopUIServices } from "@/lib/utils";
import { ImageUtils } from "@/lib/utils/image.utils";
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
      if (field.name === "image" && shop.image_key) {
        return {
          ...field,
          previewUrl: ImageUtils.getImageUrl(shop.image_key),
        };
      }
      return field;
    });

  return (
    <ShopEditDialog
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
