"use client";
import React from "react";
import { SharedForm } from "@/components/shared/shared-form";
import { FORM_FIELD_NAMES } from "@/constants";
import type { FormFieldConfig, ButtonConfig } from "@/types/ui";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLoginUser } from "@/hooks";

/**
 * Configuration properties for the LoginForm component.
 *
 * @interface LoginFormProps
 */
interface LoginFormProps {
  /**
   * Determines if the login form is for staff members or regular customers.
   * When true, the submit button displays "Sign in as Staff", otherwise "Sign in as Customer".
   *
   * @default false
   */
  isStaff?: boolean;

  /**
   * Optional error handling callback function that receives error objects.
   * Currently not implemented in the component but available for future use.
   *
   * @param error - The error object that occurred during login process
   */
  onError?: (error: Error) => void;

  /**
   * Additional CSS classes to apply to the form container for custom styling.
   *
   * @default ""
   */
  className?: string;
}

/**
 * A reusable login form component that handles user authentication for both staff and customers.
 *
 * This component provides a complete login form with email and password fields, validation,
 * and integration with the authentication system. It uses react-hook-form for form management,
 * Zod for validation, and a custom hook for handling the login mutation. The form adapts its
 * submit button text based on whether it's for staff or customer login.
 *
 * @param props - The component props
 * @param props.isStaff - Whether this is a staff login form (affects button text)
 * @param props.onError - Optional error handler callback (currently unused)
 * @param props.className - Additional CSS classes for styling
 *
 * @returns A JSX element containing the complete login form
 *
 * @see {@link SharedForm} for the underlying form component
 * @see {@link useLoginUser} for the authentication hook
 * @see {@link loginSchema} for form validation rules
 * @see {@link LoginFormData} for the form data type definition
 */
export default function LoginForm({
  isStaff = false,
  className = "",
}: LoginFormProps) {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { mutate: loginUser, isPending, error } = useLoginUser();

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
    loading: isPending,
  };

  const submitHandler = form.handleSubmit((data) => loginUser(data));

  return (
    <SharedForm
      form={form}
      fields={formFields}
      submitButton={submitButton}
      onSubmit={submitHandler}
      isLoading={isPending}
      error={error?.message}
      className={className}
    />
  );
}
