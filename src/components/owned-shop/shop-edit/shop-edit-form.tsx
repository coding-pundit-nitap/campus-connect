"use client";

import { BatchCardsManager } from "@/components/owned-shop/batch-cards/batch-cards-manager";
import { SharedForm } from "@/components/shared/shared-form";
import { useUpdateShop } from "@/hooks";
import { shopUIServices } from "@/lib/utils";
import { ImageUtils } from "@/lib/utils/image.utils";
import { ButtonConfig } from "@/types";
import { ShopUpdateFormShop } from "@/types/shop.types";

interface ShopEditFormProps {
  shop: ShopUpdateFormShop;
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
    <div className="space-y-6">
      <SharedForm
        fields={formFields}
        form={form}
        onSubmit={handlers.onSubmit}
        submitButton={submitButton}
        error={state.error}
        isLoading={state.isLoading || state.isSubmitting}
      />

      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            Delivery schedule (batch cards)
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure cutoff times. Empty schedule = direct-delivery mode.
          </p>
        </div>
        <BatchCardsManager />
      </div>
    </div>
  );
}
