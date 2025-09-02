import React from "react";

import { Button } from "@/components/ui/button";
import { useLinkShop } from "@/hooks";
import { shopUIServices } from "@/lib/utils-functions";

import SharedDialog from "../shared/shared-dialog";
import { SharedForm } from "../shared/shared-form";

export default function ShopAction() {
  const { form, state, handlers } = useLinkShop();
  const formFields = shopUIServices.createShopLinkFormFields();
  const submitButton = shopUIServices.createShopSubmitButton(state.isLoading);
  return (
    <div className="flex flex-row justify-end">
      <SharedDialog
        title="Link Shop"
        description="Link a shop to this product"
        trigger={
          <Button
            className="mb-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            variant="outline"
          >
            + Link Shop
          </Button>
        }
        showCloseButton={false}
      >
        <SharedForm
          form={form}
          submitButton={submitButton}
          onSubmit={handlers.onSubmit}
          fields={formFields}
        />
      </SharedDialog>
    </div>
  );
}
