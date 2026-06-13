import { Phone } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface PhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneForm: UseFormReturn<{ phone: string }>;
  onSubmit: (values: { phone: string }) => void;
  isUpdatingPhone: boolean;
}

export function PhoneDialog({
  open,
  onOpenChange,
  phoneForm,
  onSubmit,
  isUpdatingPhone,
}: PhoneDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border border-border/30 rounded-2xl overflow-hidden shadow-2xl p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600/10 text-blue-600 shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            Phone Number Required
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground">
            Please register your active contact details for delivery couriers to
            communicate.
          </DialogDescription>
        </DialogHeader>

        <Form {...phoneForm}>
          <form
            onSubmit={phoneForm.handleSubmit(onSubmit)}
            className="space-y-5 pt-2"
          >
            <FormField
              control={phoneForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mobile Phone Number
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="e.g. 9876543210"
                        {...field}
                        type="tel"
                        className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-rose-500" />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-5 rounded-xl border-border/60 font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingPhone}
                className="h-10 px-6 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow shadow-blue-500/10 cursor-pointer border-none"
              >
                {isUpdatingPhone ? "Saving..." : "Save & Continue"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
