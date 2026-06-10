"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import React from "react";

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
import { useUpdateShop } from "@/hooks";
import { ShopUpdateFormShop } from "@/types/shop.types";

interface ShopSettingsFormProps {
  shop: ShopUpdateFormShop;
}

export function ShopSettingsForm({ shop }: ShopSettingsFormProps) {
  const { form, state, handlers } = useUpdateShop({
    shop,
  });

  const isSaving = state.isLoading || state.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={handlers.onSubmit} className="space-y-6">
        {state.error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3.5 rounded-lg font-medium">
            {state.error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Minimum Order Value */}
          <FormField
            control={form.control}
            name="min_order_value"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Minimum Order Value
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-bold text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      placeholder="50"
                      className="pl-8 h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-[10px] text-muted-foreground/80 leading-normal font-medium">
                  Minimum cart subtotal required for a customer to checkout.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Default Delivery Fee */}
          <FormField
            control={form.control}
            name="default_delivery_fee"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Batch Delivery Fee
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-bold text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-8 h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-[10px] text-muted-foreground/80 leading-normal font-medium">
                  Standard delivery charge applied for scheduled batch slots.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Direct Delivery Fee */}
          <FormField
            control={form.control}
            name="direct_delivery_fee"
            render={({ field }) => (
              <FormItem className="space-y-1.5 md:col-span-2">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Direct Delivery Fee
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-bold text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-8 h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-[10px] text-muted-foreground/80 leading-normal font-medium">
                  Immediate, non-batched delivery surcharge.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit & Cancel Buttons */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-border/40 mt-6">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            asChild
            className="h-11 px-5 rounded-xl border-border/60 hover:bg-muted/40 font-semibold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98"
          >
            <Link href="/owner-shops">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Link>
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="h-11 px-6 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 text-white shadow shadow-orange-500/15 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none border-none cursor-pointer text-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving settings...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
