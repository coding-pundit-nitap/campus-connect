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
import { Separator } from "@/components/ui/separator";
import { ShopActionFormData } from "@/validations/shop";

import { RichTextEditor } from "../../ui/rich-text-editor";

interface DetailsStepProps {
  form: UseFormReturn<ShopActionFormData>;
  isSubmitting: boolean;
}

export function DetailsStep({ form, isSubmitting }: DetailsStepProps) {
  const descriptionValue = form.watch("description") || "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Shop Details
        </h2>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Identify your shop so customers can locate you easily.
        </p>
      </div>
      <Separator className="bg-border/40" />
      <div className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Shop Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="E.g., Midnight Munchies, Block A Canteen"
                  className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-[11px] text-muted-foreground/80">
                Your shop's public display name.
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
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </FormLabel>
              <FormControl>
                <div className="focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 rounded-xl overflow-hidden border border-border/50 transition-all duration-300">
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Write details about your menu, specialties, or standard canteen hours..."
                    disabled={field.disabled || isSubmitting}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-[11px] text-muted-foreground/80 flex justify-between">
                <span>Describe what you sell to campus students.</span>
                <span>{descriptionValue.length}/500 chars</span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
