import React from "react";
import { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ShopActionFormData } from "@/validations/shop";

import { SharedFileInput } from "../../shared/shared-file-input";

interface ImageStepProps {
  form: UseFormReturn<ShopActionFormData>;
}

export function ImageStep({ form }: ImageStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Shop Image
        </h2>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Upload a banner logo or store graphic to brand your portal.
        </p>
      </div>
      <Separator className="bg-border/40" />
      <div className="space-y-5">
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
                  placeholder="Drag & drop or click to upload brand image"
                />
              </FormControl>
              <FormDescription className="text-[11px] text-muted-foreground/80">
                Upload high resolution JPG, PNG up to 5MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
