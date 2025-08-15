"use client";
import React from "react";
import { SharedForm } from "@/components/shared/shared-form";
import { useRegisterForm } from "@/hooks/useAuth";
import { FORM_FIELD_NAMES } from "@/constants";
import type { FormFieldConfig, ButtonConfig } from "@/types/ui";
import type { RegisterFormData } from "@/lib/validations/auth";

import { registerAction } from "@/actions/authentication/register";

interface RegisterFormProps {
  isStaff?: boolean;
  onError?: (error: Error) => void;
  className?: string;
}

export default function RegisterForm({
  isStaff = false,
  className = "",
}: RegisterFormProps) {
  const { form, isLoading, error, handleSubmit } = useRegisterForm();

  const formFields: FormFieldConfig<RegisterFormData>[] = [
    {
      name: FORM_FIELD_NAMES.EMAIL,
      label: "Email",
      type: "email",
      placeholder: "Enter your email",
      required: true,
    },
    {
      name: FORM_FIELD_NAMES.NAME,
      label: "Name",
      type: "text",
      placeholder: "Enter your name",
      required: true,
    },
    {
      name: FORM_FIELD_NAMES.PASSWORD,
      label: "Password",
      type: "password",
      placeholder: "Enter your password",
      required: true,
    },
    {
      name: FORM_FIELD_NAMES.CONFIRM_PASSWORD,
      label: "Confirm Password",
      type: "password",
      placeholder: "Confirm your password",
      required: true,
    },
  ];

  const submitButton: ButtonConfig = {
    text: `Sign in as ${isStaff ? "Staff" : "Customer"}`,
    type: "submit",
    variant: "default",
    loading: isLoading,
  };

  const onSubmit = async (data: RegisterFormData) => {
    return await registerAction(data);
  };

  const submitHandler = handleSubmit(onSubmit);

  return (
    <SharedForm
      form={form}
      fields={formFields}
      submitButton={submitButton}
      onSubmit={submitHandler}
      isLoading={isLoading}
      error={error}
      className={className}
    />
  );
}
