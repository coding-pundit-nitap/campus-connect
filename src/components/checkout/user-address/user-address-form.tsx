"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddressFormData } from "@/validations/user-address-schema";

interface UserAddressFormProps {
  form: UseFormReturn<AddressFormData>;
  onSubmit: (data: AddressFormData) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
}

export function UserAddressForm({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
}: UserAddressFormProps) {
  return (
    <Card className="p-6 bg-card/40 backdrop-blur-xl border border-border/30 rounded-2xl shadow-xl shadow-indigo-500/[0.02] relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      <div className="mb-6">
        <h3 className="text-lg font-bold tracking-tight text-foreground">
          Add New Address
        </h3>
        <p className="text-xs text-muted-foreground font-medium">
          Add a new delivery address to your account.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Address Label
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Home, Dorm, Office"
                    {...field}
                    list="label-suggestions"
                    className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/50 font-medium"
                  />
                </FormControl>
                <FormMessage className="text-xs font-semibold text-rose-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="building"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Building Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter building name or address"
                    {...field}
                    className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/50 font-medium"
                  />
                </FormControl>
                <FormMessage className="text-xs font-semibold text-rose-500" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="hostel_block"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Hostel Block (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., BH-1, Block A"
                      {...field}
                      value={field.value ?? ""}
                      className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/50 font-medium"
                    />
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="room_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Room Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 101, A-204"
                      {...field}
                      className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/50 font-medium"
                    />
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-rose-500" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Notes (Optional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional instructions for delivery (e.g. drop at lobby, ring bell)..."
                    className="resize-none bg-muted/20 border-border/50 hover:border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/50 font-medium"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs font-semibold text-rose-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_default"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 bg-muted/10 p-3 rounded-xl border border-border/20">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onChange={(checked) => field.onChange(checked)}
                    className="h-5 w-5 rounded-md border-border/50 text-indigo-600 focus:ring-indigo-500/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                  />
                </FormControl>
                <div className="space-y-0.5 leading-none">
                  <FormLabel className="text-xs font-semibold text-foreground cursor-pointer">
                    Set as default address
                  </FormLabel>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    This address will be pre-selected for future orders.
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-3 pt-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-11 px-6 rounded-xl border-border/60 hover:bg-muted/30 font-semibold"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 min-w-[130px] rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/10"
            >
              {isSubmitting ? "Adding..." : "Add Address"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
