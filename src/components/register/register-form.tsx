"use client";
import React from "react";
import { SharedForm } from "@/components/shared/shared-form";
import { FORM_FIELD_NAMES } from "@/constants";
import type { FormFieldConfig, ButtonConfig } from "@/types/ui";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { useRegisterUser } from "@/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

/**
 * Configuration properties for the RegisterForm component.
 *
 * @interface RegisterFormProps
 */
interface RegisterFormProps {
  /**
   * Flag indicating whether the registration is for staff members.
   * When true, changes the submit button text to indicate staff registration.
   *
   * @default false
   */
  isStaff?: boolean;

  /**
   * Optional error handler callback function.
   * Called when registration errors occur during form submission.
   * Currently not used in the implementation but available for future error handling.
   *
   * @param error - The error object containing details about the registration failure
   */
  onError?: (error: Error) => void;

  /**
   * Optional CSS class names to apply to the form container.
   * Used for custom styling and layout adjustments.
   *
   * @default ""
   */
  className?: string;
}

/**
 * User registration form component with validation and submission handling.
 *
 * This component provides a complete registration form interface with client-side
 * validation using Zod schema validation and React Hook Form. It handles user
 * registration for both regular customers and staff members, with appropriate
 * form fields for email, name, password, and password confirmation. The component
 * integrates with the registration mutation hook for API communication and provides
 * real-time loading states and error feedback to users.
 *
 * @param props - The component props
 * @param props.isStaff - Whether this is a staff registration form
 * @param props.onError - Optional error handler callback (currently unused)
 * @param props.className - Optional CSS classes for styling customization
 *
 * @returns A JSX element containing the registration form with validation
 *
 * @see {@link SharedForm} for the underlying form component implementation
 * @see {@link useRegisterUser} for the registration mutation hook
 * @see {@link registerSchema} for the Zod validation schema
 * @see {@link RegisterFormData} for the TypeScript form data interface
 *
 * @throws {Error} May throw validation errors during form submission
 */
export default function RegisterForm({
  isStaff = false,
  className = "",
}: RegisterFormProps) {
  const { mutate, error, isPending: isLoading } = useRegisterUser();
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
    },
  });

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

  const submitHandler = form.handleSubmit((data) => mutate(data));

  return (
    <SharedForm
      form={form}
      fields={formFields}
      submitButton={submitButton}
      onSubmit={submitHandler}
      isLoading={isLoading}
      error={error?.message}
      className={className}
    />
  );
}
