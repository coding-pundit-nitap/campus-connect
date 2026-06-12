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

interface HoursLocationStepProps {
  form: UseFormReturn<ShopActionFormData>;
}

export function HoursLocationStep({ form }: HoursLocationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Hours & Location
        </h2>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Help campus students know when you are open and where to pick up
          orders.
        </p>
      </div>
      <Separator className="bg-border/40" />
      <div className="space-y-5">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Location / Pickup Point
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="E.g., Block A ground floor common room, Main Street"
                  className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-[11px] text-muted-foreground/80">
                Specific description of your physical location on campus.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="opening"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Opening Time
                </FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[10px] text-muted-foreground font-semibold">
                  E.g., 07:00 AM
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="closing"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Closing Time
                </FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[10px] text-muted-foreground font-semibold">
                  E.g., 08:00 PM
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
