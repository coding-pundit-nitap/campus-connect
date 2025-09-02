import React from "react";

import SharedDialog from "@/components/shared/shared-dialog";
import { SharedForm } from "@/components/shared/shared-form";
import { Button } from "@/components/ui/button";
import { useCreateProductForm } from "@/hooks/useProductForm";
import { productUIServices } from "@/lib/utils-functions";
import { ButtonConfig } from "@/types";

export function ShopAction() {
  const { form, state, handlers } = useCreateProductForm();
  const submitButton: ButtonConfig = {
    text: "Save Changes",
    type: "submit",
    variant: "default",
    loading: state.isLoading || state.isSubmitting,
    disabled: state.isLoading || state.isSubmitting,
  };
  const fields = productUIServices.createProductFormFields();
  return (
    <div className="flex flex-row justify-end">
      <SharedDialog
        title="Link Product"
        description="Link a product to this shop"
        trigger={
          <Button
            className="mb-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            variant="outline"
          >
            + Link Product
          </Button>
        }
        showCloseButton={false}
      >
        <SharedForm
          form={form}
          submitButton={submitButton}
          onSubmit={handlers.onSubmit}
          fields={fields}
        />
      </SharedDialog>
    </div>
  );
}
