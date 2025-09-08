import { Loader2 } from "lucide-react";
import React from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { SharedFileInput } from "@/components/shared/shared-file-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import type { ButtonConfig } from "@/types";

interface FormFieldConfig<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  accept?: string;
  maxSize?: number;
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
                  {field.type === "file" ? (
                    <SharedFileInput
                      value={formField.value}
                      onChange={formField.onChange}
                      accept={field.accept || "image/*"}
                      maxSize={field.maxSize || 5}
                      placeholder={field.placeholder}
                      disabled={field.disabled || isLoading}
                    />
                  ) : field.type === "textarea" ? (
                    <Textarea
                      {...formField}
                      placeholder={field.placeholder}
                      disabled={field.disabled || isLoading}
                    />
                  ) : (
                    <Input
                      {...formField}
                      type={field.type}
                      placeholder={field.placeholder}
                      disabled={field.disabled || isLoading}
                      onChange={(e) => {
                        if (field.type === "number") {
                          const value = e.target.value;
                          formField.onChange(value === "" ? 0 : Number(value));
                        } else {
                          formField.onChange(e);
                        }
                      }}
                    />
                  )}
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
