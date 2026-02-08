import { Loader2 } from "lucide-react";
import React from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { SharedFileInput } from "@/components/shared/shared-file-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ButtonConfig, FormFieldConfig } from "@/types";

import { SharedCategoryInput } from "./category-input/shared-category-input";

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
                  {field.type === "richtext" ? (
                    <RichTextEditor
                      value={formField.value || ""}
                      onChange={formField.onChange}
                      onBlur={formField.onBlur}
                      placeholder={field.placeholder}
                      disabled={field.disabled || isLoading}
                    />
                  ) : field.type === "category" ? (
                    <SharedCategoryInput
                      value={formField.value || ""}
                      onChange={formField.onChange}
                      placeholder={field.placeholder}
                      disabled={field.disabled || isLoading}
                      suggestions={field.suggestions}
                      isLoadingSuggestions={field.isLoadingSuggestions}
                      onSearchQuery={field.onSearchQuery}
                    />
                  ) : field.type === "file" ? (
                    <SharedFileInput
                      value={formField.value}
                      onChange={formField.onChange}
                      accept={field.accept || "image/*"}
                      maxSize={field.maxSize || 5}
                      placeholder={field.placeholder}
                      disabled={field.disabled || isLoading}
                      previewUrl={field.previewUrl}
                    />
                  ) : field.type === "select" ? (
                    <Select
                      value={formField.value}
                      onValueChange={formField.onChange}
                      disabled={field.disabled || isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "textarea" ? (
                    <Textarea
                      {...formField}
                      placeholder={field.placeholder}
                      disabled={field.disabled || isLoading}
                      maxLength={field.maxLength}
                      rows={field.customProps?.rows as number}
                    />
                  ) : (
                    <Input
                      {...formField}
                      type={field.type}
                      placeholder={field.placeholder}
                      disabled={field.disabled || isLoading}
                      maxLength={field.maxLength}
                      onChange={(e) => {
                        if (field.type === "number") {
                          const rawValue = e.currentTarget.value;
                          if (rawValue === "") {
                            formField.onChange("");
                            return;
                          }
                          const value = e.currentTarget.valueAsNumber;
                          formField.onChange(Number.isNaN(value) ? "" : value);
                        } else {
                          formField.onChange(e);
                        }
                      }}
                    />
                  )}
                </FormControl>
                {field.showCharCount && field.maxLength && (
                  <FormDescription className="text-xs">
                    {String(formField.value || "").length}/{field.maxLength}{" "}
                    characters
                  </FormDescription>
                )}
                {field.description && !field.showCharCount && (
                  <FormDescription className="text-xs">
                    {field.description}
                  </FormDescription>
                )}
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
