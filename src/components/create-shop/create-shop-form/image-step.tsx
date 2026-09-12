import React from "react";
import { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ShopActionFormData } from "@/validations/shop";

import { SharedFileInput } from "../../shared/shared-file-input";
import { fieldHintClass, stepHeadingClass, stepSubheadingClass } from "./styles";

interface ImageStepProps {
  form: UseFormReturn<ShopActionFormData>;
}

export function ImageStep({ form }: ImageStepProps) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className={stepHeadingClass}>Show off your shop</h2>
        <p className={stepSubheadingClass}>
          A clear photo is the first thing that catches a hungry student's
          eye.
        </p>
      </div>
      <FormField
        control={form.control}
        name="image"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <SharedFileInput
                value={field.value}
                onChange={(file) => field.onChange(file)}
                accept="image/*"
                maxSize={5}
                placeholder="Drag & drop or click to upload a shop photo"
              />
            </FormControl>
            <FormDescription className={fieldHintClass}>
              High resolution JPG or PNG, up to 5MB.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
