"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { UserAddress } from "@/components/checkout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
import { useUpdateUser } from "@/hooks";
import { authClient, useSession } from "@/lib/auth-client";
import { parseTimeString } from "@/lib/utils/shop-hours";
import { UserAddress as UserAddressType } from "@/types/prisma.types";

interface CheckoutFormProps {
  cart_id: string;
  total: number;
  shopOpening?: string;
  shopClosing?: string;
}

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
});

function isWithinShopHours(
  deliveryTime: Date,
  opening: string,
  closing: string
): boolean {
  const openingTime = parseTimeString(opening);
  const closingTime = parseTimeString(closing);

  if (!openingTime || !closingTime) {
    return true;
  }

  const deliveryHour = deliveryTime.getHours();
  const deliveryMinute = deliveryTime.getMinutes();
  const deliveryMinutes = deliveryHour * 60 + deliveryMinute;

  const openingMinutes = openingTime.hours * 60 + openingTime.minutes;
  const closingMinutes = closingTime.hours * 60 + closingTime.minutes;

  if (closingMinutes < openingMinutes) {
    return (
      deliveryMinutes >= openingMinutes || deliveryMinutes <= closingMinutes
    );
  }

  return deliveryMinutes >= openingMinutes && deliveryMinutes <= closingMinutes;
}

export function CheckoutForm({
  cart_id,
  total,
  shopOpening,
  shopClosing,
}: CheckoutFormProps) {
  const router = useRouter();
  const session = useSession();

  const [selectedAddress, setSelectedAddress] =
    useState<UserAddressType | null>(null);
  const [requestedDeliveryTime, setRequestedDeliveryTime] = useState<Date>();
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);

  const { mutate: updateUser, isPending: isUpdatingPhone } = useUpdateUser();

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const handleSelectTime = (date: Date) => {
    setRequestedDeliveryTime(date);
  };

  const handleAddressSelect = (address: UserAddressType) => {
    setSelectedAddress(address);
  };

  const validateDeliveryTime = (): boolean => {
    if (!requestedDeliveryTime) {
      toast.error("Please select a delivery time");
      return false;
    }
    const now = new Date();
    const minTime = new Date(now.getTime() + 15 * 60 * 1000);
    if (requestedDeliveryTime < minTime) {
      toast.error("Delivery time must be at least 15 minutes from now");
      return false;
    }

    const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (requestedDeliveryTime > maxTime) {
      toast.error("Delivery time must be within 7 days");
      return false;
    }

    if (shopOpening && shopClosing) {
      if (!isWithinShopHours(requestedDeliveryTime, shopOpening, shopClosing)) {
        toast.error(
          `Delivery time must be within shop hours (${shopOpening} - ${shopClosing})`
        );
        return false;
      }
    }

    return true;
  };

  const handlePhoneSubmit = (values: z.infer<typeof phoneSchema>) => {
    updateUser(
      { phone: values.phone },
      {
        onSuccess: async () => {
          await authClient.updateUser({ phone: values.phone });
          setShowPhoneDialog(false);
          toast.success("Phone number saved");
          proceedToPayment();
        },
        onError: () => {
          toast.error("Failed to save phone number");
        },
      }
    );
  };

  const proceedToPayment = () => {
    const checkoutData = {
      cart_id,
      delivery_address_id: selectedAddress!.id,
      requested_delivery_time: requestedDeliveryTime!.toISOString(),
    };
    sessionStorage.setItem("checkout_data", JSON.stringify(checkoutData));
    router.push(`/checkout/${cart_id}/payment`);
  };

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!validateDeliveryTime()) {
      return;
    }

    if (!session.data?.user?.phone) {
      setShowPhoneDialog(true);
      return;
    }

    proceedToPayment();
  };

  return (
    <>
      <div className="space-y-6">
        <UserAddress
          selectedAddressId={selectedAddress?.id || null}
          onAddressSelect={handleAddressSelect}
        />

        <Card className="px-0">
          <CardHeader>
            <CardTitle>Delivery Time</CardTitle>
            {shopOpening && shopClosing && (
              <p className="text-sm text-muted-foreground">
                Shop hours: {shopOpening} - {shopClosing}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <DateTimePicker handleOnDateChange={handleSelectTime} />
            {requestedDeliveryTime && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {requestedDeliveryTime.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleProceedToPayment}
              disabled={!selectedAddress || !requestedDeliveryTime}
              className="w-full"
              size="lg"
            >
              Proceed to Payment - ₹{total.toFixed(2)}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Number Required
            </DialogTitle>
            <DialogDescription>
              Please provide your phone number for delivery communication. The
              shop may need to contact you about your order.
            </DialogDescription>
          </DialogHeader>

          <Form {...phoneForm}>
            <form
              onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)}
              className="space-y-4"
            >
              <FormField
                control={phoneForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your phone number"
                        {...field}
                        type="tel"
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPhoneDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingPhone}>
                  {isUpdatingPhone ? "Saving..." : "Save & Continue"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
