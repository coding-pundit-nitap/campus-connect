"use client";

import { SharedForm } from "@/components/shared/shared-form";
import { useUpdateShop } from "@/hooks";
import { shopUIServices } from "@/lib/utils";
import { ImageUtils } from "@/lib/utils/image.utils";
import { ButtonConfig } from "@/types";
import { ShopWithOwner } from "@/types/shop.types";

interface ShopEditFormProps {
  shop: ShopWithOwner;
}

export function ShopEditForm({ shop }: ShopEditFormProps) {
  const { form, state, handlers } = useUpdateShop({
    shop,
  });

  const formFields = shopUIServices
    .createShopUpdateFormFields()
    .map((field) => {
      if (field.name === "image" && shop.image_key) {
        return {
          ...field,
          previewUrl: ImageUtils.getImageUrl(shop.image_key),
        };
      }
      if (field.name === "qr_image" && shop.qr_image_key) {
        return {
          ...field,
          previewUrl: ImageUtils.getImageUrl(shop.qr_image_key),
        };
      }
      return field;
    });

  const submitButton: ButtonConfig = {
    text: "Save Changes",
    type: "submit",
    variant: "default",
    loading: state.isLoading || state.isSubmitting,
    disabled: state.isLoading || state.isSubmitting,
  };

  return (
    <SharedForm
      fields={formFields}
      form={form}
      onSubmit={handlers.onSubmit}
      submitButton={submitButton}
      error={state.error}
      isLoading={state.isLoading || state.isSubmitting}
    />
  );
}
