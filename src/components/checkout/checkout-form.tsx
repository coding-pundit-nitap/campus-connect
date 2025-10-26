"use client";

import { UserAddress as UserAddressType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { UserAddress } from "@/components/checkout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
interface CheckoutFormProps {
  cart_id: string;
  total: number;
}

export function CheckoutForm({ cart_id, total }: CheckoutFormProps) {
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

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!requestedDeliveryTime) {
      toast.error("Please select a delivery time");
      return;
    }

    const checkoutData = {
      cart_id,
      delivery_address_id: selectedAddress.id,
      requested_delivery_time: requestedDeliveryTime.toISOString(),
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
