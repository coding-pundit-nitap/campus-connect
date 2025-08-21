import React from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import type { FieldValues, UseFormReturn, Path } from "react-hook-form";
import type { ButtonConfig } from "@/types/ui";

/**
 * Configuration interface for individual form fields in the SharedForm component.
 *
 * This interface defines the structure and properties required for each form field
 * rendered within the SharedForm. It provides type-safe field configuration with
 * support for various input types, validation rules, and accessibility features.
 * The interface uses React Hook Form's Path type to ensure type safety for field names.
 *
 * @template T - The form data type extending FieldValues for type safety
 *
 * @interface FormFieldConfig
 * @property {Path<T>} name - The field name that matches a property in the form data type
 * @property {string} label - Display label for the form field
 * @property {string} [type] - HTML input type (text, email, password, etc.). Defaults to "text"
 * @property {string} [placeholder] - Placeholder text shown when field is empty
 * @property {boolean} [disabled] - Whether the field should be disabled
 * @property {boolean} [required] - Whether the field is required for form submission
 *
 * @example
 * ```tsx
 * const emailField: FormFieldConfig<LoginForm> = {
 *   name: "email",
 *   label: "Email Address",
 *   type: "email",
 *   placeholder: "Enter your email",
 *   required: true
 * };
 *
 * const passwordField: FormFieldConfig<LoginForm> = {
 *   name: "password",
 *   label: "Password",
 *   type: "password",
 *   placeholder: "Enter your password",
 *   required: true
 * };
 * ```
 *
 * @see {@link Path} from react-hook-form for type-safe field naming
 * @see {@link FieldValues} for the base form data structure
 */
interface FormFieldConfig<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Props interface for the SharedForm component.
 *
 * This interface defines all the properties required to configure and render
 * a complete form using the SharedForm component. It provides type-safe
 * integration with React Hook Form and supports flexible form configurations
 * including field definitions, submit handling, loading states, and error display.
 *
 * @template T - The form data type extending FieldValues for complete type safety
 *
 * @interface SharedFormProps
 * @property {UseFormReturn<T>} form - React Hook Form instance managing form state
 * @property {FormFieldConfig<T>[]} fields - Array of field configurations to render
 * @property {ButtonConfig} submitButton - Configuration for the form submission button
 * @property {function} onSubmit - Form submission handler function
 * @property {boolean} [isLoading] - Loading state indicator for async operations
 * @property {string | null} [error] - Error message to display to users
 * @property {string} [className] - Additional CSS classes for form styling
 * @property {React.ReactNode} [children] - Optional additional content between fields and submit button
 *
 * @example
 * ```tsx
 * const formProps: SharedFormProps<UserRegistration> = {
 *   form: useForm<UserRegistration>(),
 *   fields: [
 *     { name: "username", label: "Username", required: true },
 *     { name: "email", label: "Email", type: "email", required: true }
 *   ],
 *   submitButton: { text: "Register", variant: "default" },
 *   onSubmit: handleSubmit,
 *   isLoading: false,
 *   error: null
 * };
 * ```
 *
 * @see {@link UseFormReturn} from react-hook-form for form state management
 * @see {@link ButtonConfig} for submit button configuration options
 * @see {@link FormFieldConfig} for individual field configuration
 */
interface SharedFormProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  fields: FormFieldConfig<T>[];
  submitButton: ButtonConfig;
  onSubmit: (e?: React.BaseSyntheticEvent) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable form component that provides a standardized form layout and functionality.
 *
 * This component serves as a comprehensive form wrapper that handles field rendering,
 * validation display, error messaging, and submit button management. It integrates
 * seamlessly with React Hook Form for form state management and provides consistent
 * styling and behavior across the application. The component supports dynamic field
 * configuration, loading states, error handling, and custom content injection.
 *
 * @template T - The form data type extending FieldValues for complete type safety
 *
 * @param props - The component props
 * @param props.form - React Hook Form instance managing the form state and validation
 * @param props.fields - Array of field configurations defining form inputs to render
 * @param props.submitButton - Configuration object for the form submission button
 * @param props.onSubmit - Form submission handler, called when form is submitted
 * @param props.isLoading - Optional loading state to disable form and show spinner
 * @param props.error - Optional error message to display at the top of the form
 * @param props.className - Optional additional CSS classes for form customization
 * @param props.children - Optional content rendered between fields and submit button
 *
 * @returns A JSX element containing the complete form with all configured fields and controls
 *
 * @example
 * ```tsx
 * // Basic login form
 * const loginForm = useForm<LoginData>();
 * const loginFields: FormFieldConfig<LoginData>[] = [
 *   { name: "email", label: "Email", type: "email", required: true },
 *   { name: "password", label: "Password", type: "password", required: true }
 * ];
 *
 * <SharedForm
 *   form={loginForm}
 *   fields={loginFields}
 *   submitButton={{ text: "Sign In", variant: "default" }}
 *   onSubmit={handleLogin}
 *   isLoading={isLoading}
 *   error={loginError}
 * />
 *
 * // Registration form with custom content
 * <SharedForm
 *   form={registerForm}
 *   fields={registerFields}
 *   submitButton={{ text: "Create Account", variant: "default" }}
 *   onSubmit={handleRegister}
 *   className="max-w-md mx-auto"
 * >
 *   <div className="text-center text-sm text-gray-600">
 *     By signing up, you agree to our Terms of Service
 *   </div>
 * </SharedForm>
 *
 * // Form with disabled fields during submission
 * <SharedForm
 *   form={profileForm}
 *   fields={profileFields.map(field => ({
 *     ...field,
 *     disabled: isSubmitting
 *   }))}
 *   submitButton={{ text: "Save Changes", variant: "default" }}
 *   onSubmit={handleSave}
 *   isLoading={isSubmitting}
 * />
 * ```
 *
 * @see {@link Form} from @/components/ui/form for the underlying form wrapper
 * @see {@link FormField} from @/components/ui/form for individual field rendering
 * @see {@link Button} from @/components/ui/button for submit button component
 * @see {@link Alert} from @/components/ui/alert for error message display
 * @see {@link UseFormReturn} from react-hook-form for form state management
 * @see {@link ButtonConfig} for submit button configuration options
 *
 * @throws {Error} Form submission errors are handled by the onSubmit handler
 *
 * @since 1.0.0
 */
export function SharedForm<T extends FieldValues>({
  form,
  fields,
  submitButton,
  onSubmit,
  isLoading = false,
  error,
  className = "",
  children,
}: SharedFormProps<T>) {
  return (
    <Form {...form}>
      <form className={`space-y-4 ${className}`} onSubmit={onSubmit}>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled={field.disabled || isLoading}
                    required={field.required}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        {children}

        <Button
          className="w-full"
          type={submitButton.type || "submit"}
          variant={submitButton.variant}
          size={submitButton.size}
          disabled={submitButton.disabled || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButton.text}
        </Button>
      </form>
    </Form>
  );
}
