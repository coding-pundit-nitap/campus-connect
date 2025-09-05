import React from "react";
import { UseFormReturn } from "react-hook-form";

import SharedDialog from "@/components/shared/shared-dialog";
import { SharedForm } from "@/components/shared/shared-form";
import { Button } from "@/components/ui/button";
import { ButtonConfig, FormFieldConfig } from "@/types";
import { SerializedProduct } from "@/types/product.types";
import { ProductFormData } from "@/validations";

interface ProductEditDialogProps {
  product: SerializedProduct;
  form: UseFormReturn<ProductFormData>;
  state: {
    isLoading: boolean;
    isSubmitting?: boolean;
    error: string | null;
  };
  handlers: {
    onSubmit: (e?: React.BaseSyntheticEvent) => void | Promise<void>;
    openDialog: () => void;
    closeDialog: () => void;
  };
  fields: FormFieldConfig<ProductFormData>[];
  className?: string;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

export function ProductEditDialog({
  form,
  state,
  handlers,
  fields,
  className,
  isDialogOpen,
  setIsDialogOpen,
}: ProductEditDialogProps) {
  const submitButton: ButtonConfig = {
    text: "Save Changes",
    type: "submit",
    variant: "default",
    loading: state.isLoading || state.isSubmitting,
    disabled: state.isLoading || state.isSubmitting,
  };

  return (
    <SharedDialog
      trigger={
        <Button className={className} variant="outline">
          Edit
        </Button>
      }
      title="Edit Product"
      showCloseButton={false}
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
    >
      <SharedForm
        fields={fields}
        form={form}
        onSubmit={handlers.onSubmit}
        submitButton={submitButton}
        error={state.error}
        isLoading={state.isLoading || state.isSubmitting}
      />
    </SharedDialog>
  );
}
