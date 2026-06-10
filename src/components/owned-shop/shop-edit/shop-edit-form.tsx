"use client";

import { SharedForm } from "@/components/shared/shared-form";
import { Button } from "@/components/ui/button";
import { useUpdateShop } from "@/hooks";
import { shopUIServices } from "@/lib/utils";
import { ImageUtils } from "@/lib/utils/image.utils";
import { ButtonConfig } from "@/types";
import { ShopUpdateFormShop } from "@/types/shop.types";

interface ShopEditFormProps {
  shop: ShopUpdateFormShop;
  onCancel?: () => void;
}

export function ShopEditForm({ shop, onCancel }: ShopEditFormProps) {
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
    <div className="space-y-8">
      <SharedForm
        fields={formFields}
        form={form}
        onSubmit={handlers.onSubmit}
        submitButton={submitButton}
        error={state.error}
        isLoading={state.isLoading || state.isSubmitting}
      >
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={state.isLoading || state.isSubmitting}
            className="w-full h-11 px-5 rounded-xl border-border/60 hover:bg-muted/40 font-semibold text-xs cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            Cancel
          </Button>
        )}
      </SharedForm>
    </div>
  );
}
