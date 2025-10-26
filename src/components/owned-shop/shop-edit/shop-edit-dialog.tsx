import { Edit } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";

import SharedDialog from "@/components/shared/shared-dialog";
import { SharedForm } from "@/components/shared/shared-form";
import { ButtonConfig, FormFieldConfig } from "@/types";
import { ShopActionFormData } from "@/validations";

interface ShopEditDialogProps {
  form: UseFormReturn<ShopActionFormData>;
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
  fields: FormFieldConfig<ShopActionFormData>[];
  className?: string;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

export function ShopEditDialog({
  form,
  state,
  handlers,
  fields,
  className,
  isDialogOpen,
  setIsDialogOpen,
}: ShopEditDialogProps) {
  const submitButton: ButtonConfig = {
    text: "Save Changes",
    type: "submit",
    variant: "default",
    loading: state.isLoading || state.isSubmitting,
    disabled: state.isLoading || state.isSubmitting,
  };

  return (
    <SharedDialog
      trigger={<Edit className="mr-2" />}
      title="Edit Shop"
      showCloseButton={false}
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      className={className}
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
