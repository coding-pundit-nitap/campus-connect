import React from "react";
import { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ShopActionFormData } from "@/validations/shop";

import { RichTextEditor } from "../../ui/rich-text-editor";
import {
  fieldHintClass,
  fieldInputClass,
  fieldLabelClass,
  stepHeadingClass,
  stepSubheadingClass,
} from "./styles";

interface DetailsStepProps {
  form: UseFormReturn<ShopActionFormData>;
  isSubmitting: boolean;
}

export function DetailsStep({ form, isSubmitting }: DetailsStepProps) {
  const descriptionValue = form.watch("description") || "";

  return (
    <div className="space-y-7">
      <div>
        <h2 className={stepHeadingClass}>Tell students who you are</h2>
        <p className={stepSubheadingClass}>
          Your name and description are the first thing shoppers see.
        </p>
      </div>
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>Shop name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Midnight Munchies, Block A Canteen..."
                  className={fieldInputClass}
                  {...field}
                />
              </FormControl>
              <FormDescription className={fieldHintClass}>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>Description</FormLabel>
              <FormControl>
                <div className="overflow-hidden rounded-lg border border-border/60 transition-colors focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10">
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="What do you sell? Any specialties or standard hours worth mentioning..."
                    disabled={field.disabled || isSubmitting}
                  />
                </div>
              </FormControl>
              <FormDescription className={`${fieldHintClass} flex justify-between`}>
                <span>Describe what you sell to campus students.</span>
                <span>{descriptionValue.length}/500</span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
