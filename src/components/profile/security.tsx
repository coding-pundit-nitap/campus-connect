"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SharedCard } from "@/components/shared/shared-card";
import { SharedForm } from "@/components/shared/shared-form";
import { Separator } from "@/components/ui/separator";
import { useChangePassword } from "@/hooks";
import { ButtonConfig, FormFieldConfig } from "@/types";
import { changePasswordSchema } from "@/validations/user.validation";

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

const SecuritySettings = () => {
  const { mutate: changePassword, isPending, error } = useChangePassword();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(
    async (values: ChangePasswordFormValues) => {
      changePassword(values, {
        onSuccess: () => {
          form.reset();
        },
      });
    }
  );

  const fields: FormFieldConfig<ChangePasswordFormValues>[] = [
    {
      name: "currentPassword",
      label: "Current Password",
      type: "password",
      placeholder: "Enter your current password",
      required: true,
    },
    {
      name: "newPassword",
      label: "New Password",
      type: "password",
      placeholder: "Enter your new password",
      description: "Choose a strong password with at least 6 characters",
      required: true,
    },
    {
      name: "confirmPassword",
      label: "Confirm New Password",
      type: "password",
      placeholder: "Confirm your new password",
      required: true,
    },
  ];

  const submitButton: ButtonConfig = {
    text: isPending ? "Updating Password..." : "Update Password",
    type: "submit",
    variant: "default",
    size: "lg",
    disabled: isPending,
  };

  const headerContent = (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Security Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your password and account security
          </p>
        </div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 mt-4">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Password Requirements</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Minimum 6 characters long</li>
              <li>• Must match the confirmation field</li>
              <li>• Should be different from your current password</li>
            </ul>
          </div>
        </div>
      </div>
      <Separator className="mt-6" />
    </>
  );

  return (
    <SharedCard
      className="border-2"
      showHeader={true}
      headerContent={headerContent}
      headerClassName="pb-0"
    >
      <SharedForm
        form={form}
        fields={fields}
        submitButton={submitButton}
        onSubmit={onSubmit}
        isLoading={isPending}
        error={error?.message || null}
      />
    </SharedCard>
  );
};

export default SecuritySettings;
