import { Product } from "@prisma/client";
import React from "react";
import { UseFormReturn } from "react-hook-form";

import SharedDialog from "@/components/shared/shared-dialog";
import { SharedForm } from "@/components/shared/shared-form";
import { Button } from "@/components/ui/button";
import { ButtonConfig, FormFieldConfig } from "@/types";
import { ProductFormData } from "@/validations";

interface ProductEditDialogProps {
  product: Product;
  onEdit: (data: ProductFormData) => void;
  form: UseFormReturn<ProductFormData>;
  state: {
    isLoading: boolean;
    isSubmitting?: boolean;
    error: string | null;
  };
  handlers: {
    onSubmit: (e?: React.BaseSyntheticEvent) => void | Promise<void>;
  };
  fields: FormFieldConfig<ProductFormData>[];
  className?: string;
}

export function ProductEditDialog({
  form,
  state,
  handlers,
  fields,
  className,
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
