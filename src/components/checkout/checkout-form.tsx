"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { OrderSummary, UserAddress } from "@/components/checkout";
import { BatchSlotSelector } from "@/components/checkout/batch-slot-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CartItemData } from "@/types";
import { UserAddress as UserAddressType } from "@/types/prisma.types";

interface CheckoutFormProps {
  cart_id: string;
  shopOpening?: string;
  shopClosing?: string;
  direct_delivery_fee?: number;
  deliveryFee: number;
  platformFee: number;
  itemTotal: number;
  items: CartItemData[];
  batchSlots?: {
    id: string;
    cutoff_time_minutes: number;
    label: string | null;
  }[];
}

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
});

export function CheckoutForm({
  cart_id,
  shopOpening,
  shopClosing,
  direct_delivery_fee = 0,
  deliveryFee = 0,
  platformFee = 0,
  itemTotal,
  items,
  batchSlots = [],
}: CheckoutFormProps) {
  const router = useRouter();
  const session = useSession();

  const [selectedAddress, setSelectedAddress] =
    useState<UserAddressType | null>(null);
  const [requestedDeliveryTime, setRequestedDeliveryTime] =
    useState<Date | null>(null);
  const [isDirectDelivery, setIsDirectDelivery] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);

  const { mutate: updateUser, isPending: isUpdatingPhone } = useUpdateUser();

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const activeDeliveryFee = isDirectDelivery
    ? direct_delivery_fee
    : deliveryFee;
  const total = itemTotal + activeDeliveryFee + platformFee;

  const handleSelectSlot = (date: Date | null) => {
    if (date === null) {
      setIsDirectDelivery(true);
      setRequestedDeliveryTime(null);
    } else {
      setIsDirectDelivery(false);
      setRequestedDeliveryTime(date);
    }
  };

  const handleAddressSelect = (address: UserAddressType) => {
    setSelectedAddress(address);
  };

  const validateDeliveryTime = (): boolean => {
    const hasBatchCards = batchSlots.length > 0;

    if (hasBatchCards && !requestedDeliveryTime && !isDirectDelivery) {
      toast.error("Please select a batch slot or direct delivery");
      return false;
    }

    if (isDirectDelivery || !requestedDeliveryTime) {
      return true;
    }

    const now = new Date();
    if (requestedDeliveryTime.getTime() <= now.getTime()) {
      toast.error("Selected batch slot is in the past");
      return false;
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
    const checkoutData: {
      cart_id: string;
      delivery_address_id: string;
      requested_delivery_time?: string;
      is_direct_delivery: boolean;
    } = {
      cart_id,
      delivery_address_id: selectedAddress!.id,
      is_direct_delivery: isDirectDelivery,
    };

    if (requestedDeliveryTime && !isDirectDelivery) {
      checkoutData.requested_delivery_time =
        requestedDeliveryTime.toISOString();
    }
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
            <CardTitle>Select Delivery Batch</CardTitle>
            {shopOpening && shopClosing && (
              <p className="text-sm text-muted-foreground">
                Shop hours: {shopOpening} - {shopClosing}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {batchSlots.length > 0 ? (
              <BatchSlotSelector
                batchSlots={batchSlots}
                selectedSlot={requestedDeliveryTime}
                isDirectDelivery={isDirectDelivery}
                directDeliveryFee={direct_delivery_fee}
                onSlotSelect={handleSelectSlot}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                This shop delivers directly (no batch cards configured).
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleProceedToPayment}
              disabled={
                !selectedAddress ||
                (batchSlots.length > 0 &&
                  !requestedDeliveryTime &&
                  !isDirectDelivery)
              }
              className="w-full"
              size="lg"
            >
              Proceed to Payment - ₹{total.toFixed(2)}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <OrderSummary
          items={items}
          itemTotal={itemTotal}
          deliveryFee={activeDeliveryFee}
          platformFee={platformFee}
          total={total}
          isDirectDelivery={isDirectDelivery}
        />
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
