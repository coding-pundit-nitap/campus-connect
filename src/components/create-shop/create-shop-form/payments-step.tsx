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
import { ShopActionFormData } from "@/validations";

import { SharedFileInput } from "../../shared/shared-file-input";

interface PaymentsStepProps {
  form: UseFormReturn<ShopActionFormData>;
}

export function PaymentsStep({ form }: PaymentsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Payments Setup
        </h2>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Provide your billing info so campus students can pay you online.
        </p>
      </div>
      <Separator className="bg-border/40" />
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="upi_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                UPI ID
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-mono text-sm uppercase tracking-wider placeholder:text-muted-foreground/40 font-semibold"
                  placeholder="e.g. merchant@ybl, canteenname@okaxis"
                />
              </FormControl>
              <FormDescription className="text-[11px] text-muted-foreground/80">
                The exact UPI address where online customer payments are routed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="qr_image"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Billing QR Code
              </FormLabel>
              <FormControl>
                <SharedFileInput
                  value={field.value}
                  onChange={(file) => field.onChange(file)}
                  accept="image/*"
                  maxSize={5}
                  placeholder="Upload your UPI QR code image"
                />
              </FormControl>
              <FormDescription className="text-[11px] text-muted-foreground/80">
                Upload a screenshot of your UPI QR code for visual scan pay
                validation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
