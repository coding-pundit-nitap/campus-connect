"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SharedForm } from "@/components/shared/shared-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    text: isPending ? "Updating..." : "Update Password",
    type: "submit",
    variant: "default",
    disabled: isPending,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Change your password here.</CardDescription>
      </CardHeader>
      <CardContent>
        <SharedForm
          form={form}
          fields={fields}
          submitButton={submitButton}
          onSubmit={onSubmit}
          isLoading={isPending}
          error={error?.message || null}
        />
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
