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
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold">
                  Minimum Order Value
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      placeholder="50"
                      className="pl-8 h-10 border-input bg-background font-medium focus-visible:ring-1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-[11px] leading-normal">
                  Minimum cart subtotal required for a customer to place an
                  order.
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
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold">
                  Default Delivery Fee
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-8 h-10 border-input bg-background font-medium focus-visible:ring-1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-[11px] leading-normal">
                  Standard delivery charge applied for regular batch deliveries.
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
              <FormItem className="space-y-2 md:col-span-2">
                <FormLabel className="text-sm font-semibold">
                  Direct Delivery Fee
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-8 h-10 border-input bg-background font-medium focus-visible:ring-1"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-[11px] leading-normal">
                  Delivery surcharge applied when customers bypass batching to
                  request immediate delivery.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit & Cancel Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" disabled={isSaving} asChild>
            <Link href="/owner-shops">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Cancel
            </Link>
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="font-semibold px-5"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
