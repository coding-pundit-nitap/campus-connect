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

interface FormFieldConfig<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

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
