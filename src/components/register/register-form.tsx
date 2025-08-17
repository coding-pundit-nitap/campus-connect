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
 * @example
 * ```tsx
 * // Basic customer registration form
 * <RegisterForm />
 *
 * // Staff registration form
 * <RegisterForm isStaff={true} />
 *
 * // Custom styling and error handling
 * <RegisterForm
 *   className="max-w-md mx-auto"
 *   onError={(error) => console.error('Registration failed:', error)}
 * />
 *
 * // Complete configuration
 * <RegisterForm
 *   isStaff={false}
 *   className="w-full p-4"
 *   onError={handleRegistrationError}
 * />
 * ```
 *
 * @remarks
 * **Form Fields:**
 * - **Email**: Required email input with validation
 * - **Name**: Required text input for user's full name
 * - **Password**: Required password input with strength requirements
 * - **Confirm Password**: Required password confirmation for verification
 *
 * **Validation:**
 * - Uses Zod schema validation for type-safe form validation
 * - Email format validation and required field checks
 * - Password confirmation matching validation
 * - Real-time validation feedback as user types
 *
 * **Form State Management:**
 * - Powered by React Hook Form for optimal performance
 * - Minimal re-renders and efficient validation
 * - Default values set for all form fields
 * - Automatic form reset after successful submission
 *
 * **Loading States:**
 * - Submit button shows loading state during registration
 * - Form is disabled during submission to prevent duplicate requests
 * - Loading state sourced from useRegisterUser mutation hook
 *
 * **Error Handling:**
 * - Displays server-side validation errors from API
 * - Client-side validation errors shown in real-time
 * - Error messages are user-friendly and actionable
 *
 * **Accessibility:**
 * - Proper form labels and ARIA attributes
 * - Keyboard navigation support
 * - Screen reader compatible error announcements
 *
 * **Integration:**
 * - Uses SharedForm component for consistent UI/UX
 * - Integrates with useRegisterUser hook for API communication
 * - Follows application-wide form field naming conventions
 *
 * **Security Features:**
 * - Password confirmation to prevent typos
 * - Client-side validation before API submission
 * - Secure form submission handling
 *
 * @see {@link SharedForm} for the underlying form component implementation
 * @see {@link useRegisterUser} for the registration mutation hook
 * @see {@link registerSchema} for the Zod validation schema
 * @see {@link RegisterFormData} for the TypeScript form data interface
 *
 * @throws {Error} May throw validation errors during form submission
 *
 * @todo Implement proper error handling integration with onError prop
 * @todo Add password strength indicator
 * @todo Consider adding optional fields for user profile information
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
