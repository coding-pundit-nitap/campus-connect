"use client";
import React from "react";
import { SharedForm } from "@/components/shared/shared-form";
import { useLoginForm } from "@/hooks/useAuth";
import { FORM_FIELD_NAMES } from "@/constants";
import type { FormFieldConfig, ButtonConfig } from "@/types/ui";
import type { LoginFormData } from "@/lib/validations/auth";

interface LoginFormProps {
  isStaff?: boolean;
  onError?: (error: Error) => void;
  className?: string;
}

export default function LoginForm({
  isStaff = false,
  className = "",
}: LoginFormProps) {
  const { form, isLoading, error, handleSubmit } = useLoginForm();

  const formFields: FormFieldConfig<LoginFormData>[] = [
    {
      name: FORM_FIELD_NAMES.EMAIL,
      label: "Email",
      type: "email",
      placeholder: "Enter your email",
      required: true,
    },
    {
      name: FORM_FIELD_NAMES.PASSWORD,
      label: "Password",
      type: "password",
      placeholder: "Enter your password",
      required: true,
    },
  ];

  const submitButton: ButtonConfig = {
    text: `Sign in as ${isStaff ? "Staff" : "Customer"}`,
    type: "submit",
    variant: "default",
    loading: isLoading,
  };

  const onSubmit = async (data: LoginFormData) => {
    console.log("Form submitted with data:", data);
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
