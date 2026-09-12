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
import { ShopActionFormData } from "@/validations";

import { SharedFileInput } from "../../shared/shared-file-input";
import {
  fieldHintClass,
  fieldInputClass,
  fieldLabelClass,
  stepHeadingClass,
  stepSubheadingClass,
} from "./styles";

interface PaymentsStepProps {
  form: UseFormReturn<ShopActionFormData>;
}

export function PaymentsStep({ form }: PaymentsStepProps) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className={stepHeadingClass}>Get paid directly</h2>
        <p className={stepSubheadingClass}>
          Students pay you straight through UPI — no middleman.
        </p>
      </div>
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="upi_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>UPI ID</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  className={`${fieldInputClass} font-mono tracking-wide`}
                  placeholder="merchant@ybl, canteenname@okaxis"
                />
              </FormControl>
              <FormDescription className={fieldHintClass}>
                The exact UPI address where customer payments are routed.
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
              <FormLabel className={fieldLabelClass}>
                Billing QR code
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
              <FormDescription className={fieldHintClass}>
                A screenshot of your UPI QR code for scan-to-pay.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
