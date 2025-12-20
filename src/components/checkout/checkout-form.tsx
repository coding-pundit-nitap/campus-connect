"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { UserAddress } from "@/components/checkout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { parseTimeString } from "@/lib/utils/shop-hours";
import { UserAddress as UserAddressType } from "@/types/prisma.types";

interface CheckoutFormProps {
  cart_id: string;
  total: number;
  shopOpening?: string;
  shopClosing?: string;
}

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

  const [selectedAddress, setSelectedAddress] =
    useState<UserAddressType | null>(null);
  const [requestedDeliveryTime, setRequestedDeliveryTime] = useState<Date>();

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

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!validateDeliveryTime()) {
      return;
    }

    const checkoutData = {
      cart_id,
      delivery_address_id: selectedAddress.id,
      requested_delivery_time: requestedDeliveryTime!.toISOString(),
    };
    sessionStorage.setItem("checkout_data", JSON.stringify(checkoutData));

    router.push(`/checkout/${cart_id}/payment`);
  };

  return (
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
  );
}
